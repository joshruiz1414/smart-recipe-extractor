
"use client";

import { useState } from "react";

interface InstructionProps {
  instructions: string[];
}

export function Instructions({ instructions }: InstructionProps) {
    return(
        <div>
            {/* instructions */}
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-3 text-slate-300">
            {instructions.map((step, index) => (
                <li key={index} className="leading-relaxed mb-2">{step}</li>
            ))}
            </ol>
        </div>
);
}

