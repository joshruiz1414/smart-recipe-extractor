"use client";

import { useState } from "react";

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

  // ADD THESE 9 LINES RIGHT HERE:
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // track whether user confirmed the extracted recipe
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

  // clear function to reset everything
  const handleClear = () => {
    setUrl("");
    setRecipe(null);
    setError('');
    setIsConfirmed(null);
    setCheckedIngredients({});
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

  const [copied, setCopied] = useState(false);

  const handleCopyIngredients = () => {
    if (!recipe) return;

    // join all ingredient items into a clean list separated by new lines
    const textToCopy = recipe.ingredients.join("\n");
    navigator.clipboard.writeText(textToCopy);

    // visual feedback for 2 seconds
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUrl(url);

    setLoading(true);
    setError("");
    setRecipe(null);
    setCheckedIngredients({});
    setIsConfirmed(null);

    try {
    // send POST request to our API endpoint
    const response = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }), // sends { url: "https://..." }
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
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="url"
          required
          placeholder="https://www.recipes.com/recipe/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>

      {/* error message display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* recipe output card */}
      {recipe && (
      <div className="border border-indigo-700 rounded-lg p-6 bg-slate-950 text-slate-100 shadow-xl space-y-6">

        {/* Header with Title and Clear Button */}
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

        {/* Verification Banner: Asks "Is this correct?" */}
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

        {/* Optional: Show confirmation badge once verified */}
        {isConfirmed === true && (
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            ✓ Recipe Verified
          </div>
        )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {/* ingredients Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-indigo-400">Ingredients</h3>
              <button
                type="button"
                onClick={handleCopyIngredients}
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? "Copied!" : "Copy List"}
              </button>
            </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((item, index) => {
                  // check if this specific item's index is true in state
                  const isChecked = Boolean(checkedIngredients[index]);

                  return (
                    <li key={index}>
                      {/* wrap in a <label> so clicking the text toggles the box */}
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIngredient(index)}
                          className="mt-1 h-4 w-4 cursor-pointer"
                        />
                        {/* apply line through when isChecked is true */}
                        <span className={isChecked ? "line-through text-gray-500" : ""}>
                          {item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* instructions Section */}
            <div>
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Instructions</h3>
              <ol className="list-decimal list-inside space-y-3 text-slate-300">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="leading-relaxed mb-2">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}