"use client";

import { useState, useEffect } from "react";

interface CookingModeProps {
  recipeTitle: string;
  instructions: string[];
  onClose: () => void;
}

export function CookingMode({ recipeTitle, instructions, onClose }: CookingModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentStep = instructions[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === instructions.length - 1;

  // screen Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Parse Timers (Detects "15 minutes", "30 mins", etc.)
  const detectTimeInStep = (text: string): number | null => {
    // Regex looking for patterns like "15 minutes", "5 min", "1 hour", etc.
    const match = text.match(/(\d+)\s*(hour|hr|minute|min)/i);
    if (!match) return null;

    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit.startsWith("h")) return amount * 3600;
    return amount * 60; // default to minutes
  };

  const detectedSeconds = detectTimeInStep(currentStep);

  // Countdown Interval logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Reset timer when step changes
  useEffect(() => {
    setTimerSeconds(null);
    setIsTimerRunning(false);
  }, [currentStepIndex]);

  const startTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

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
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>

      {/* Center: Main Step Display */}
      <div className="max-w-3xl mx-auto w-full text-center space-y-6 my-auto">
        <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-sm font-medium">
          Step {currentStepIndex + 1} of {instructions.length}
        </span>

        <p className="text-2xl sm:text-4xl font-medium leading-relaxed text-slate-100">
          {currentStep}
        </p>

        {/* Dynamic Timer Widget */}
        {detectedSeconds !== null && (
          <div className="pt-4">
            {timerSeconds === null ? (
              <button
                type="button"
                onClick={() => startTimer(detectedSeconds)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-full transition-colors cursor-pointer text-base"
              >
                ⏱️ Start Timer ({Math.round(detectedSeconds / 60)} min)
              </button>
            ) : (
              <div className="inline-flex items-center gap-4 bg-slate-900 border border-amber-500/50 px-6 py-3 rounded-full">
                <span className="text-3xl font-mono font-bold text-amber-400">
                  {formatTimerDisplay(timerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  {isTimerRunning ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => setTimerSeconds(null)}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 max-w-3xl mx-auto w-full">
        <button
          type="button"
          disabled={isFirstStep}
          onClick={() => setCurrentStepIndex((prev) => prev - 1)}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-colors"
          >
            🎉 Finish Cooking
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStepIndex((prev) => prev + 1)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
          >
            Next Step →
          </button>
        )}
      </div>
    </div>
  );
}