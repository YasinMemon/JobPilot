"use client";

import React from "react";
import { QuickActionCard } from "./QuickActionCard";
import { QUICK_ACTIONS } from "../constants";
import type { AIToolKey } from "@/types/ai";

interface QuickActionGridProps {
  onCTAClick: (prompt: string, tool?: AIToolKey) => void;
}

/**
 * 3-column responsive grid of Quick Action cards.
 * Collapses to 2 columns on tablet and 1 on mobile.
 */
export function QuickActionGrid({ onCTAClick }: QuickActionGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-semibold text-white">Quick Actions</h2>
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
          {QUICK_ACTIONS.length} tools
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action, i) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onCTAClick={onCTAClick}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
