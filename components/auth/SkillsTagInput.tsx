"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SkillsTagInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
  error?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  suggestions?: string[];
};

export default function SkillsTagInput({
  value,
  onChange,
  error,
  label = "Skills",
  helperText,
  placeholder = "Add a skill and press Enter",
  suggestions = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Tailwind CSS",
    "AI/ML",
  ],
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const normalizedSkills = useMemo(
    () => value.map((skill) => skill.trim()).filter(Boolean),
    [value],
  );

  const addSkill = (rawSkill: string) => {
    const nextSkill = rawSkill.trim();
    if (!nextSkill) {
      return;
    }

    const exists = normalizedSkills.some(
      (skill) => skill.toLowerCase() === nextSkill.toLowerCase(),
    );
    if (exists) {
      setInputValue("");
      return;
    }

    onChange([...normalizedSkills, nextSkill]);
    setInputValue("");
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(normalizedSkills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(inputValue);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-200">
        {label}
      </label>

      <div
        className={cn(
          "rounded-2xl border bg-white/5 p-3 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10",
          error ? "border-rose-400" : "border-white/10",
        )}
      >
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {normalizedSkills.map((skill) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 4 }}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-200 ring-1 ring-inset ring-indigo-500/20"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full p-0.5 text-indigo-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="size-3.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-w-48 flex-1 border-0 bg-transparent px-1 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Press Enter to add a skill or click a suggestion.
        </p>
        {helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
