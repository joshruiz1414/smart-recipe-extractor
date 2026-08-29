"use client";

import { useState } from "react";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}
export function UrlForm({onSubmit, loading}: UrlFormProps){
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        onSubmit(url);
    }

return(
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
);
}