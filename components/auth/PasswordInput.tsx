"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import Input, { type InputProps } from "./Input";

type PasswordInputProps = Omit<InputProps, "type" | "rightElement" | "leftIcon"> &
  InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  props,
  ref
) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={isVisible ? "text" : "password"}
      leftIcon={<Lock className="size-4" />}
      rightElement={
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;