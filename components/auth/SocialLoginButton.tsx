"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SocialLoginButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
};

export default function SocialLoginButton({ label, icon, className, ...props }: SocialLoginButtonProps) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
    >
      <button
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 shadow-sm transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10",
          className
        )}
        {...props}
      >
        <span className="text-slate-300">{icon}</span>
        {label}
      </button>
    </motion.div>
  );
}