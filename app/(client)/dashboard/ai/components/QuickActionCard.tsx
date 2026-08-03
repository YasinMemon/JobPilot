"use client";

import React from "react";
import { motion } from "framer-motion";
import type { QuickAction } from "../types";
import type { AIToolKey } from "@/types/ai";

interface QuickActionCardProps {
  action: QuickAction;
  onCTAClick: (prompt: string, tool?: AIToolKey) => void;
  index: number;
}

/**
 * A single "Quick Action" card with icon, gradient background,
 * title, description and a CTA button.
 * Passes the tool key to the chat handler for specialized AI responses.
 */
export const QuickActionCard = React.memo(function QuickActionCard({
  action,
  onCTAClick,
  index,
}: QuickActionCardProps) {
  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border border-[#27272a] bg-[#111111] p-5 flex flex-col gap-4 transition-all duration-300 hover:border-[#3f3f46] hover:shadow-xl hover:shadow-black/40"
    >
      {/* Subtle top-gradient accent on hover */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.iconGradient} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className={`h-5 w-5 ${action.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-[14px] font-semibold text-white mb-1.5 tracking-tight">
          {action.title}
        </h3>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          {action.description}
        </p>
      </div>

      {/* CTA */}
      <button
        id={`quick-action-${action.id}`}
        onClick={() => onCTAClick(action.prompt, action.tool)}
        className="w-full rounded-xl border border-[#27272a] bg-[#0f0f0f] py-2 text-[12px] font-semibold text-zinc-300 transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300"
      >
        {action.cta}
      </button>
    </motion.div>
  );
});
