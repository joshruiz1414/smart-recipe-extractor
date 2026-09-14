import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import he from "he";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  url: string;
}

// helper to recursively flatten complex HowToSection / HowToStep arrays in JSON-LD
function parseInstructionsFromSchema(rawInstructions: any): string[] {
  if (!rawInstructions) return [];

  const steps: string[] = [];

  const extract = (item: any) => {
    if (typeof item === "string") {
      steps.push(item);
    } else if (Array.isArray(item)) {
      item.forEach(extract);
    } else if (typeof item === "object" && item !== null) {
      if (item.text) {
        steps.push(item.text);
      } else if (item.name && item["@type"] === "HowToStep") {
        steps.push(item.name);
      }
      if (Array.isArray(item.itemListElement)) {
        item.itemListElement.forEach(extract);
      }
    }
  };

  extract(rawInstructions);

  return steps
    .filter(Boolean)
    .map((step) => he.decode(step).trim());
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL string is required." },
        { status: 400 }
      );
    }

    // fetch web page HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let extractedRecipe: RecipeData | null = null;


    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();

    for (const el of jsonLdScripts) {
      try {
        const content = $(el).html();
        if (!content) continue;

        const json = JSON.parse(content);
        const graph: any[] = Array.isArray(json)
          ? json
          : json["@graph"] || [json];

        const recipeNode = graph.find(
          (item: any) =>
            item?.["@type"] === "Recipe" ||
            (Array.isArray(item?.["@type"]) && item["@type"].includes("Recipe"))
        );

        if (recipeNode) {
          const instructions = parseInstructionsFromSchema(recipeNode.recipeInstructions);
          const rawIngredients: string[] = recipeNode.recipeIngredient || [];
          const ingredients = rawIngredients.map((item: string) => he.decode(item).trim());

          extractedRecipe = {
            title: recipeNode.name ? he.decode(recipeNode.name).trim() : "Untitled Recipe",
            ingredients: ingredients,
            instructions: instructions,
            url: url,
          };
          break;
        }
      } catch {
        // ignore invalid JSON script tags
      }
    }

    // return early if JSON-LD successfully captured both parts
    if (
      extractedRecipe &&
      extractedRecipe.ingredients.length > 0 &&
      extractedRecipe.instructions.length > 0
    ) {
      return NextResponse.json({ source: "json-ld", recipe: extractedRecipe });
    }

    // AI Fallback if JSON-LD was incomplete or missing
    $("script, style, nav, footer, iframe, noscript").remove();
    const cleanedText = $("body").text().replace(/\s+/g, " ").slice(0, 10000);

    const prompt = `Extract the full recipe from this content including measurements and step-by-step instructions. Return strict JSON with fields "title" (string), "ingredients" (array of strings), and "instructions" (array of detailed instruction strings in order).\n\nText:\n${cleanedText}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const aiText = aiResponse.text;
    if (!aiText) {
      return NextResponse.json(
        { error: "AI failed to parse recipe content." },
        { status: 500 }
      );
    }

    const parsedAiRecipe: RecipeData = JSON.parse(aiText);

    const currentExtracted: RecipeData | null = extractedRecipe;

    const finalRecipe: RecipeData = {
      title: currentExtracted?.title || parsedAiRecipe.title || "Untitled Recipe",
      ingredients:
        currentExtracted && currentExtracted.ingredients.length > 0
          ? currentExtracted.ingredients
          : parsedAiRecipe.ingredients,
      instructions:
        currentExtracted && currentExtracted.instructions.length > 0
          ? currentExtracted.instructions
          : parsedAiRecipe.instructions,
      url: url,
    };

    return NextResponse.json({ source: "ai", recipe: finalRecipe });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}