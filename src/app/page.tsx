"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUrl(url);
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