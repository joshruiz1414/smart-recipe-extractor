"use client";

import { useState, useEffect } from "react";

interface CookingModeProps {
  recipeTitle: string;
  instructions: string[];
  ingredients: string[];
  onClose: () => void;
}


export function CookingMode({ recipeTitle, instructions, ingredients, onClose }: CookingModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [showIngredients, setShowIngredients] = useState(true);

  const currentStep = instructions[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === instructions.length - 1;

  // prevent background body scrolling while Cooking Mode is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // disable background scrolling
    document.body.style.overflow = "hidden";

    // enable background scrolling when Cooking Mode closes
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // screen Wake Lock API
useEffect(() => {
  let wakeLock: WakeLockSentinel | null = null;

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  };

  requestWakeLock();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    wakeLock?.release();
  };
}, []);


return (
  <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-10">
    {/* Top Header */}
    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Cooking Mode
        </span>
        <h2 className="text-lg font-bold truncate max-w-xs sm:max-w-md text-slate-200">
          {recipeTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowIngredients(!showIngredients)}
          className="px-3 py-1.5 text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded border border-indigo-800 transition-colors cursor-pointer"
        >
          {showIngredients ? "Hide Ingredients" : "View Ingredients"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>
    </div>
    {/* Center Section: Step Text + Ingredients Panel */}
    <div className="max-w-8xl mx-auto w-full flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 my-4 min-h-0 overflow-hidden">

      {/* Step Text Container */}
      <div className="flex-1 text-center space-y-6 overflow-y-auto max-h-[65vh] px-4">
        <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-sm font-medium">
          Step {currentStepIndex + 1} of {instructions.length}
        </span>

        <p className="text-2xl sm:text-4xl font-medium leading-relaxed text-slate-100">
          {currentStep}
        </p>

      </div>

      {/* Slide out Ingredients Card */}
      {showIngredients && (
        <div className="w-full sm:w-80 h-[55vh] max-h-[500px] bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shrink-0 shadow-2xl">
          <h3 className="text-sm font-semibold text-indigo-400 mb-3 border-b border-slate-800 pb-2 shrink-0">
            All Ingredients ({ingredients.length})
          </h3>

          {/* Dedicated Scroll Container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-sm text-slate-300 min-h-0">
            <ul className="space-y-2.5">
              {ingredients.map((item, idx) => (
                <li key={idx} className="border-b border-slate-800/50 pb-2 last:border-0 leading-snug">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* Bottom Controls */}
    <div className="flex items-center justify-between border-t border-slate-800 pt-4 max-w-3xl mx-auto w-full">
      <button
        type="button"
        disabled={isFirstStep}
        onClick={() => setCurrentStepIndex((prev) => prev - 1)}
        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        ← Previous
      </button>

      {isLastStep ? (
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
        >
         Finish Cooking
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev) => prev + 1)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
          Next Step →
        </button>
      )}
    </div>
  </div>
);
}