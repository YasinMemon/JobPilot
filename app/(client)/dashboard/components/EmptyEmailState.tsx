"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { EMPTY_EMAIL_STATE_TAGS } from "../constants";

/**
 * Empty state displayed in the generated email panel before any email
 * has been generated. Encourages the user to paste a job description.
 */
export const EmptyEmailState = React.memo(function EmptyEmailState() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#27272a] bg-[#161616]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">
        Ready to generate your next outreach?
      </h3>
      <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">
        Paste a job description on the left and let JobPilot craft a
        personalized cold email in seconds.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {EMPTY_EMAIL_STATE_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#27272a] bg-[#1c1c1c] px-2.5 py-0.5 text-[10px] text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});
