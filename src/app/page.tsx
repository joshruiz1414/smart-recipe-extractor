"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  // use null because we don't have recipe data yet
  const [recipe, setRecipe] = useState(null);

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
    setError("Network error. Please try again.");
  } finally {
    // always stop loading, whether it succeeded or failed
    setLoading(false);
  }
};


  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Smart Recipe Extractor (Test Page)</h1>
      <p>If you can see this, your Next.js dev server is working properly!</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="url"
          required
          placeholder="Paste a recipe URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ padding: "0.5rem", width: "300px", marginRight: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Test Submit
        </button>
      </form>

      {submittedUrl && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ccc" }}>
          <strong>Submitted URL:</strong> {submittedUrl}
        </div>
      )}
    </main>
  );
}