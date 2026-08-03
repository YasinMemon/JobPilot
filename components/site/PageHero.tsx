import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PageHeroAction[];
  children?: ReactNode;
  className?: string;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden border-b border-white/5", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#6366f120,transparent_55%),radial-gradient(circle_at_bottom_right,#8b5cf614,transparent_42%)]" />
      <div className="absolute -right-20 top-8 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
            {eyebrow}
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {description}
          </p>

          {actions?.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => {
                const isPrimary = action.variant !== "secondary";

                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25",
                      isPrimary
                        ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-[0_12px_30px_rgba(99,102,241,0.25)] hover:brightness-110"
                        : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {action.label}
                    {isPrimary ? <ArrowRight className="size-4" /> : null}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
