"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small presentational primitives for the resume feature, styled with the
 * same dark palette used across the dashboard (#0a0a0a / #111111 / #27272a).
 */

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const inputCls =
  "w-full rounded-xl border border-[#27272a] bg-[#0a0a0a] px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors focus:border-blue-500/50 disabled:opacity-50";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#27272a] bg-[#111111] p-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-semibold text-white">{children}</h2>
      {right}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-zinc-600">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function TextArea({
  rows = 3,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={cn(inputCls, "resize-y leading-relaxed", props.className)}
    />
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-900/20 hover:opacity-95",
  secondary:
    "border border-[#27272a] bg-[#111111] text-zinc-300 hover:border-[#3f3f46] hover:bg-[#1c1c1c] hover:text-white",
  ghost: "text-zinc-400 hover:bg-[#1c1c1c] hover:text-zinc-100",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Btn({
  variant = "secondary",
  loading,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        btnVariants[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-[#1c1c1c] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  tone = "neutral",
  onRemove,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "gap" | "info";
  onRemove?: () => void;
}) {
  const tones = {
    neutral: "border-[#27272a] bg-[#1c1c1c] text-zinc-300",
    good: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    gap: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    info: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-medium",
        tones[tone],
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="text-current opacity-60 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/** Comma/Enter separated chip input for string lists. */
export function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const existing = new Set(value.map((v) => v.toLowerCase()));
    const fresh = parts.filter((p) => !existing.has(p.toLowerCase()));
    if (fresh.length) onChange([...value, ...fresh]);
    setDraft("");
  };

  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#27272a] bg-[#0a0a0a] p-2 focus-within:border-blue-500/50">
      {value.map((v, i) => (
        <Chip key={`${v}-${i}`} onRemove={() => onChange(value.filter((_, j) => j !== i))}>
          {v}
        </Chip>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#27272a] bg-[#111111] p-5 shadow-2xl sm:p-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <h3 className="mb-3 text-[15px] font-bold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** Small dropdown menu that closes on outside click. */
export function Menu({
  trigger,
  children,
  align = "right",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            "absolute z-30 mt-1 min-w-[200px] rounded-xl border border-[#27272a] bg-[#111111] p-1 shadow-2xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-zinc-300 transition-colors hover:bg-[#1c1c1c] hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Cycles through status messages while an async task is running. */
export function LoadingSteps({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 2200);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/20">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {steps.map((s, idx) => (
            <li
              key={s}
              className={cn(
                "text-[12.5px] transition-all duration-500",
                idx < i && "text-emerald-400/80",
                idx === i && "text-zinc-200",
                idx > i && "text-zinc-700",
              )}
            >
              {idx < i ? "✓ " : idx === i ? "› " : "  "}
              {s}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
