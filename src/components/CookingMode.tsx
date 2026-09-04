"use client";

import { useState, useEffect } from "react";

interface CookingModeProps {
  recipeTitle: string;
  instructions: string[];
  ingredients: string[];
  onClose: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


export function CookingMode({ recipeTitle, instructions, ingredients, onClose }: CookingModeProps) {


  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isVoiceEnabled) {
      setIsListening(false);
      return;
    }
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      setIsVoiceEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
  // flag to know if the user intentionally closed Cooking Mode
  let isComponentMounted = true;

  recognition.onresult = (event: any) => {
    const lastIndex = event.results.length - 1;
    const transcript = event.results[lastIndex][0].transcript
      .trim()
      .toLowerCase();
    console.log("Voice Command Recognized:", transcript);
    if (transcript.includes("next")) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, instructions.length - 1));
    } else if (transcript.includes("previous") || transcript.includes("back")) {
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    } else if (transcript.includes("repeat")) {
      // pause recognition briefly while speaking to stop self triggering
      recognition.stop();

      const utterance = new SpeechSynthesisUtterance(instructions[currentStepIndex]);
      utterance.onend = () => {
        // resume listening once speech synthesis finishes
        if (isComponentMounted) recognition.start();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // auto restart if the browser stops listening unexpectedly, turn it right back on!
  recognition.onend = () => {
    setIsListening(false)
    if (isComponentMounted && !window.speechSynthesis.speaking) {
      try {
        recognition.start();
      } catch {
        // prevent crashes if recognition is already starting
      }
    }
  };

  try {
    recognition.start();
  } catch (err) {
    console.error("Speech recognition start error:", err);
  }

  return () => {
    isComponentMounted = false;
    recognition.stop();
    window.speechSynthesis.cancel(); // stop speaking if closed
  };
}, [isVoiceEnabled, currentStepIndex, instructions]);

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
    {isListening && (
  <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full animate-pulse">
    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
    Voice Control Active ("Next", "Back", "Repeat")
  </span>
)}
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

      {/* voice control button */}
      <button
        type="button"
        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
        className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
          isVoiceEnabled
            ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
        }`}
      >
      <span className={`w-2 h-2 rounded-full ${isListening ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
      {isVoiceEnabled ? "🎙️ Voice On" : "🎙️ Enable Voice"}
    </button>
      {/*show ingredients button*/}
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