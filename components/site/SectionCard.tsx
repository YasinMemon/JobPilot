import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  id?: string;
};

export default function SectionCard({ title, eyebrow, children, id }: SectionCardProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-indigo-200">
            {eyebrow ?? "•"}
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">
          {children}
        </div>
      </div>
    </section>
  );
}
