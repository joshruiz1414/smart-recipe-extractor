import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
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

    // try JSON-LD parsing first
    let extractedRecipe: RecipeData | null = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "");
        const graph = Array.isArray(json) ? json : json["@graph"] || [json];
        const recipeNode = graph.find(
          (item: { "@type": string | string[] }) =>
            item["@type"] === "Recipe" ||
            (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
        );

        if (recipeNode) {
          const rawInstructions = recipeNode.recipeInstructions || [];
          const instructions = Array.isArray(rawInstructions)
            ? rawInstructions.map((step: string | { text: string }) =>
                typeof step === "string" ? step : step.text || ""
              )
            : [rawInstructions];

          extractedRecipe = {
            title: recipeNode.name || "Untitled Recipe",
            ingredients: recipeNode.recipeIngredient || [],
            instructions: instructions.filter(Boolean),
          };
        }
      } catch {
        // ignore JSON parse errors for invalid scripts
      }
    });

    if (extractedRecipe) {
      return NextResponse.json({ source: "json-ld", recipe: extractedRecipe });
    }

    // fallback to Gemini AI if JSON-LD metadata wasn't found
    $("script, style, nav, footer, iframe, noscript").remove();
    const cleanedText = $("body").text().replace(/\s+/g, " ").slice(0, 10000);

    const prompt = `Extract the recipe from this web page content. Return strict JSON with fields "title", "ingredients" (array of strings), and "instructions" (array of strings in order).\n\nText:\n${cleanedText}`;

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
    return NextResponse.json({ source: "ai", recipe: parsedAiRecipe });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
