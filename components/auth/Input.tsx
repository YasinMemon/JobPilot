"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      className,
      containerClassName,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium text-slate-200">
          {label}
          {required ? <span aria-hidden="true" className="text-indigo-300">*</span> : null}
        </label>

        <div className="relative">
          {leftIcon ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helpId : undefined}
            className={cn(
              "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-400",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10",
              className
            )}
            {...props}
          />

          {rightElement ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightElement}
            </div>
          ) : null}
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs font-medium text-rose-600"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              id={helpId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-slate-400"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;