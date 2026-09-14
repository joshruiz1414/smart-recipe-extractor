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
    else if (
      transcript.includes("show ingredients")
    ) {
      setShowIngredients(true)
    }
    else if (
      transcript.includes("hide ingredients")
    ) {
      setShowIngredients(false)
    }
    else if (
    transcript.includes("exit") ||
    transcript.includes("close cooking mode") ||
    transcript.includes("cancel cooking mode") ||
    transcript.includes("stop cooking")
  ) {
    recognition.stop();
    window.speechSynthesis.cancel();
    onClose(); // <-- Same callback function as "✕ Exit" button
  }
  else if (
    transcript.includes("disable voice") ||
    transcript.includes("turn off voice") ||
    transcript.includes("stop listening") ||
    transcript.includes("mute voice")
  ) {
    recognition.stop();
    window.speechSynthesis.cancel();
    setIsVoiceEnabled(false);
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
  <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 min-h-dvh overflow-hidden">

    {/* voice active banner */}
    {isListening && (
      <div className="mb-2 flex items-center justify-center shrink-0">
        <span className="flex items-center gap-2 text-[10px] sm:text-xs text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-3 py-1 rounded-full animate-pulse text-center max-w-full truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">Voice Control Active ("Next", "Back", "Repeat", "Show/Hide Ingredients", "Exit/Cancel Cooking Mode", "Disable Voice")</span>
        </span>
      </div>
    )}

    {/* top header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3 shrink-0">
      <div className="min-w-0 flex-1">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-400 block">
          Cooking Mode
        </span>
        <h2 className="text-base sm:text-lg font-bold truncate text-slate-200 max-w-full">
          {recipeTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
        {/* voice control button */}
        <button
          type="button"
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
            isVoiceEnabled
              ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isListening ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          {isVoiceEnabled ? "🎙️ Voice On" : "🎙️ Voice"}
        </button>

        {/* show ingredients button */}
        <button
          type="button"
          onClick={() => setShowIngredients(!showIngredients)}
          className="px-2.5 py-1.5 text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-md border border-indigo-800 transition-colors cursor-pointer"
        >
          {showIngredients ? "Hide Ingredients" : "Ingredients"}
        </button>

        {/* exit Button */}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-md border border-rose-800 transition-colors cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>
    </div>

    {/* center Section: step text adn ingredients panel */}
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 my-3 min-h-0 overflow-hidden">

      {/* step text container */}
      <div className="flex-1 w-full text-center space-y-4 sm:space-y-6 overflow-y-auto min-h-0 px-2 sm:px-4 py-2 flex flex-col items-center justify-center">
        <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-xs sm:text-sm font-medium shrink-0">
          Step {currentStepIndex + 1} of {instructions.length}
        </span>

        <p className="text-xl sm:text-3xl md:text-4xl font-medium leading-relaxed text-slate-100 max-w-3xl">
          {currentStep}
        </p>
      </div>

      {/* slide out ingredients card */}
      {showIngredients && (
        <div className="w-full sm:w-80 h-48 sm:h-full max-h-[450px] bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shrink-0 shadow-2xl min-h-0">
          <h3 className="text-xs sm:text-sm font-semibold text-indigo-400 mb-2 border-b border-slate-800 pb-2 shrink-0">
            Ingredients ({ingredients.length})
          </h3>

          {/* scroll container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs sm:text-sm text-slate-300 min-h-0">
            <ul className="space-y-2">
              {ingredients.map((item, idx) => (
                <li key={idx} className="border-b border-slate-800/50 pb-1.5 last:border-0 leading-snug">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* bottom navigation controls */}
    <div className="flex items-center justify-between border-t border-slate-800 pt-3 sm:pt-4 max-w-3xl mx-auto w-full gap-3 shrink-0 pb-safe">
      <button
        type="button"
        disabled={isFirstStep}
        onClick={() => setCurrentStepIndex((prev) => prev - 1)}
        className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 text-sm sm:text-base font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-center"
      >
        ← Previous
      </button>

      {isLastStep ? (
        <button
          type="button"
          onClick={onClose}
          className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-500 text-slate-950 text-sm sm:text-base font-bold rounded-xl transition-colors cursor-pointer text-center"
        >
          Finish Cooking 🎉
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev) => prev + 1)}
          className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-500 text-white text-sm sm:text-base font-bold rounded-xl transition-colors cursor-pointer text-center"
        >
          Next Step →
        </button>
      )}
    </div>
  </div>
);
}