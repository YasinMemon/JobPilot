"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { AI_TIPS } from "../mock";

const ROTATION_INTERVAL_MS = 8000;

/**
 * Rotating AI tips card — cycles through tips every 8 seconds
 * with a smooth fade-and-slide animation.
 */
export function AITipsCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % AI_TIPS.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const tip = AI_TIPS[index];

  return (
    <div className="rounded-2xl border border-[#27272a] bg-gradient-to-br from-[#111111] to-[#0f0f0f] p-4 overflow-hidden relative">
      {/* Subtle glow */}
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Lightbulb className="h-3 w-3 text-amber-400" />
        </div>
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
          AI Tip
        </span>
        {/* Dot indicators */}
        <div className="ml-auto flex items-center gap-1">
          {AI_TIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-indigo-400" : "w-1.5 bg-[#27272a]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tip text with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tip.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2"
        >
          <span className="text-base shrink-0 mt-0.5">{tip.emoji}</span>
          <p className="text-[12px] text-zinc-400 leading-relaxed">{tip.text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
