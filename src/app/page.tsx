"use client";

import { useState } from "react";
import { IngredientList } from "@/components/IngredientList";
import { Instructions } from "@/components/Instructions";
import { UrlForm } from "@/components/UrlForm";
interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  // use null because we don't have recipe data yet
  // now recipe can be null or Recipe object
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // false because we aren't fetching anything initially
  const [loading, setLoading] = useState(false);

  // null because there are no errors when the page loads
  const [error, setError] = useState("");


  // track whether user confirmed the extracted recipe
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

  // clear function to reset everything
  const handleClear = () => {
    setUrl("");
    setRecipe(null);
    setError('');
    setIsConfirmed(null);
  };
  // confirm recipe function
  const handleConfirmRecipe = (confirmed: boolean) => {
    setIsConfirmed(confirmed);
    if (!confirmed) {
      // if user says "No", clear the recipe and prompt them to try another link
      setError("Please check the URL and try extracting again.");
      setRecipe(null);
    }
  };

  const handleCopyIngredients = () => {
    if (!recipe) return;

    // join all ingredient items into a clean list separated by new lines
    const textToCopy = recipe.ingredients.join("\n");
    navigator.clipboard.writeText(textToCopy);

  };

  const handleSubmit = async (submittedUrl: string) => {
    setSubmittedUrl(submittedUrl);

    setLoading(true);
    setError("");
    setRecipe(null);
    setIsConfirmed(null);

    try {
    // send POST request to our API endpoint
    const response = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: submittedUrl }), // sends { url: "https://..." }
    });

    const data = await response.json();

    if (!response.ok) {
      // if server returned an error (like 400 or 500)
      setError(data.error || "Failed to parse recipe.");
    } else {
      // success! Store the recipe data in state
      setRecipe(data.recipe);
      console.log('success')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    setError(message);
  } finally {
    // always stop loading, whether it succeeded or failed
    setLoading(false);
  }
};

return (
    <main className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">Smart Recipe Extractor</h1>
      <p className="text-white-600 mb-6">Paste any recipe link below to pull out clean ingredients and instructions.</p>
      {/* link input form */}
      <UrlForm onSubmit={handleSubmit} loading={loading} />

      {/* error message display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* recipe output card */}
      {recipe && (

      <div className="border border-indigo-700 rounded-lg p-6 bg-slate-950 text-slate-100 shadow-xl space-y-6">

        {/* Clear Button */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-100">{recipe.title}</h2>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition-colors cursor-pointer"
          >
            Clear Recipe
          </button>
        </div>

        {/* asks "Is this correct recipe" */}
        {isConfirmed === null && (
          <div className="p-3.5 bg-indigo-950/70 border border-indigo-800 rounded-lg flex items-center justify-between gap-3 text-sm">
            <span className="text-indigo-200">Is this the correct recipe you were looking for?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirmRecipe(true)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors cursor-pointer text-xs"
              >
                Yes, looks good!
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRecipe(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                No, try again
              </button>
            </div>
          </div>
        )}

        {/* show confirmation badge once verified */}
        {isConfirmed === true && (
        <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-800 pb-4 text-center">
          <button
            type="button"
            className="text-xl px-3 py-1.5 bg-green-950 hover:bg-green-900 text-emerald-400 rounded border border-green-800 transition-colors cursor-pointer"
          >
            Begin Cooking!
          </button>
          <h2 className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            ✓ Recipe Verified
          </h2>
        </div>

        )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">

          <IngredientList ingredients={recipe.ingredients} />
          <Instructions instructions={recipe.instructions} />
          </div>
        </div>
      )}
    </main>
  );
}