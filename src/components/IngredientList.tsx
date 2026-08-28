"use client";

import { useState } from "react";

interface IngredientListProps {
  ingredients: string[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyIngredients = () => {
    const textToCopy = ingredients.join("\n");
    navigator.clipboard.writeText(textToCopy);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* copy button */}
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

      {/* checkbox list */}
      <ul className="space-y-2">
        {ingredients.map((item, index) => {
          const isChecked = Boolean(checkedIngredients[index]);

          return (
            <li key={index}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleIngredient(index)}
                  className="mt-1 h-4 w-4 cursor-pointer accent-indigo-500"
                />
                <span className={isChecked ? "line-through text-slate-500" : "text-slate-300"}>
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}