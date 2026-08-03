"use client";

import React from "react";

interface EmailFieldRowProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

/**
 * A compact labelled input row that mimics Gmail's compose field style.
 * Used for Subject / To / CC / BCC rows.
 */
export function EmailFieldRow({
  label,
  id,
  value,
  onChange,
  placeholder = "",
  required = false,
  type = "text",
}: EmailFieldRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[#27272a] px-4 py-2 group transition-colors duration-150 hover:bg-white/[0.01]">
      <label
        htmlFor={id}
        className="w-12 shrink-0 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide select-none"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="flex-1 bg-transparent py-0.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:outline-none caret-blue-400 transition-colors"
      />
    </div>
  );
}
