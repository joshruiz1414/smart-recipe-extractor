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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUrl(url);

    setLoading(true);
    setError("");
    setRecipe(null);

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

      {/* 2. error message display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 3. recipe output card */}
      {recipe && (
        <div className="border border-indigo-700 rounded-lg p-6 bg-slate-950 text-slate-100 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-3">{recipe.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {/* ingredients Section */}
            <div>
              <h3 className="text-lg font-semibold text-indigo-400 mb-3">Ingredients</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                {recipe.ingredients.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
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