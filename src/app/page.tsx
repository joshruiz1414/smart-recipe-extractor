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
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Smart Recipe Extractor</h1>
      <p>Paste any recipe link below to pull out clean ingredients and instructions.</p>

      {/* link input form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="url"
          required
          placeholder="https://www.recipes.com/recipe/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, padding: "0.75rem", fontSize: "1rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>

      {/* 2. error message display */}
      {error && (
        <div style={{ padding: "1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "1rem" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 3. recipe output card */}
      {recipe && (
        <div style={{ border: "1px solid #2710d0", borderRadius: "8px", padding: "1.5rem", background: "#00050a" }}>
          <h2 style={{ marginTop: 0, color: "#e8ecf4" }}>{recipe.title}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}>
            {/* ingredients Section */}
            <div>
              <h3>Ingredients</h3>
              <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                {recipe.ingredients.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* instructions section */}
            <div>
              <h3>Instructions</h3>
              <ol style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                {recipe.instructions.map((step, index) => (
                  <li key={index} style={{ marginBottom: "0.5rem" }}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}