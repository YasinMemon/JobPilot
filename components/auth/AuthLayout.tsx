import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: WandSparkles,
    title: "AI-guided applications",
    description:
      "Personalized job materials, reminders, and next-step suggestions in one place.",
  },
  {
    icon: BadgeCheck,
    title: "Structured workflows",
    description:
      "Keep every application organized from first draft to final follow-up.",
  },
  {
    icon: Sparkles,
    title: "Premium experience",
    description:
      "Minimal UI, fast interactions, and a focus on the details that matter.",
  },
];

export default function AuthLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-[#09090b] text-white", className)}>
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_38%), linear-gradient(180deg,_rgba(17,24,39,0.95)_0%,_rgba(9,9,11,1)_72%)] px-10 py-12 lg:flex lg:flex-col">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-10 top-24 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex items-center gap-3 text-white">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-radient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
              <span className="text-lg font-semibold">J</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-indigo-300">
                JobPilot
              </p>
              <p className="text-sm text-slate-400">
                AI-powered job application platform
              </p>
            </div>
          </div>

          <div className="relative mt-auto max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-indigo-200 shadow-sm backdrop-blur">
              <Sparkles className="size-4" />
              Smart workflows for serious applicants
            </div>

            <div className="space-y-4">
              <h1 className="max-w-lg text-5xl font-semibold tracking-tight text-white">
                Manage every application with more clarity and less friction.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                JobPilot combines AI assistance, polished tracking, and
                thoughtful automation to help you move faster without losing
                control.
              </p>
            </div>

            <div className="grid gap-4">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;
                return (
                  <div
                    key={highlight.title}
                    className="flex gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/15">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {highlight.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-indigo-200"
            >
              Create your account <ArrowRight className="size-4" />
            </Link>
          </div>
        </aside>

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </section>
      </div>
    </div>
  );
}
