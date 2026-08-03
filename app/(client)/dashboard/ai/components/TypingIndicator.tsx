"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Three animated bouncing dots to indicate the AI is "typing".
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-2">
      {/* AI Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/30">
        <span className="text-[10px]">✨</span>
      </div>

      {/* Bubble */}
      <div className="rounded-2xl rounded-bl-sm border border-[#27272a] bg-[#111111] px-4 py-3 shadow-lg">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-zinc-500"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
