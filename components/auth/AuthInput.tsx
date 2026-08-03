"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  hint?: string;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, rightElement, hint, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <span className={cn("text-gray-400 h-4 w-4", error && "text-red-400")}>
                {icon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "w-full rounded-xl border bg-white text-gray-900 text-sm transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              icon ? "pl-10" : "pl-3.5",
              rightElement ? "pr-10" : "pr-3.5",
              "py-2.5",
              error
                ? "border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50/30"
                : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-400">
            {hint}
          </p>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={`${inputId}-error`}
              role="alert"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-red-500 font-medium flex items-center gap-1"
            >
              <span aria-hidden="true">•</span> {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
