"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
};

export default function LoadingButton({
  loading = false,
  loadingLabel,
  icon,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <motion.div
      whileTap={{ scale: isDisabled ? 1 : 0.985 }}
      transition={{ duration: 0.12 }}
    >
      <button
        disabled={isDisabled}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : icon ? <span>{icon}</span> : null}
        <span>{loading ? loadingLabel ?? children : children}</span>
      </button>
    </motion.div>
  );
}
