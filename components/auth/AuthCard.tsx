"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function AuthCard({
  title,
  subtitle,
  badge,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8",
        className
      )}
    >
      {badge ? (
        <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
          {badge}
        </div>
      ) : null}

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="text-sm leading-6 text-slate-300">{subtitle}</p> : null}
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-6">{footer}</div> : null}
    </motion.section>
  );
}