"use client";

import { AlertCircle, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JDAnalysis, KeywordImportance, MatchBreakdown } from "@/types/resume";
import { Card, CardTitle, Chip } from "./ui";

const IMPORTANCE_LABEL: Record<KeywordImportance, string> = {
  required: "Required",
  preferred: "Preferred",
  important: "Important",
  nice_to_have: "Nice to have",
};

const IMPORTANCE_ORDER: KeywordImportance[] = ["required", "important", "preferred", "nice_to_have"];

function InfoItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-0.5 text-[13px] text-zinc-200">{value}</p>
    </div>
  );
}

function SkillList({ title, skills, tone }: { title: string; skills: string[]; tone: "neutral" | "info" }) {
  if (!skills.length) return null;
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-zinc-400">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <Chip key={s} tone={tone}>{s}</Chip>
        ))}
      </div>
    </div>
  );
}

/** Strong matches vs. gaps — shared by the analysis step and the match panel. */
export function SkillGapBlock({ analysis }: { analysis: JDAnalysis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
        <p className="mb-2 text-[12px] font-semibold text-emerald-300">Strong matches (in your profile)</p>
        {analysis.matchedSkills.length ? (
          <ul className="space-y-1">
            {analysis.matchedSkills.map((s) => (
              <li key={s} className="flex items-center gap-2 text-[13px] text-zinc-200">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-zinc-500">No direct skill matches found.</p>
        )}
      </div>
      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
        <p className="mb-1 text-[12px] font-semibold text-amber-300">Mentioned in the JD but missing from your profile</p>
        <p className="mb-2 text-[11px] text-zinc-500">
          These are <strong>not</strong> added to your resume. Add them to your profile only if you genuinely have them.
        </p>
        {analysis.missingSkills.length ? (
          <ul className="space-y-1">
            {analysis.missingSkills.map((s) => (
              <li key={s} className="flex items-center gap-2 text-[13px] text-zinc-200">
                <Circle className="h-3 w-3 text-amber-400" /> {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-zinc-500">No gaps — your profile covers every skill listed.</p>
        )}
      </div>
    </div>
  );
}

export function JDAnalysisPanel({ analysis }: { analysis: JDAnalysis }) {
  const total = analysis.matchedSkills.length + analysis.missingSkills.length;
  const keywordGroups = IMPORTANCE_ORDER.map((imp) => ({
    imp,
    items: analysis.keywords.filter((k) => k.importance === imp),
  })).filter((g) => g.items.length);

  return (
    <Card className="space-y-6">
      <CardTitle>Job description analysis</CardTitle>

      <div>
        <h3 className="text-[18px] font-bold text-white">{analysis.jobTitle || "Role not specified"}</h3>
        {analysis.company && <p className="text-[13px] text-zinc-500">{analysis.company}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoItem label="Experience" value={analysis.experience} />
        <InfoItem label="Employment" value={analysis.employmentType} />
        <InfoItem label="Location" value={analysis.location} />
        <InfoItem label="Work mode" value={analysis.workMode} />
      </div>

      <div className="space-y-4">
        <SkillList title="Required skills" skills={analysis.requiredSkills} tone="info" />
        <SkillList title="Preferred skills" skills={analysis.preferredSkills} tone="neutral" />
        <SkillList title="Soft skills" skills={analysis.skillGroups.soft} tone="neutral" />
      </div>

      {analysis.responsibilities.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-semibold text-zinc-400">Key responsibilities</p>
          <ul className="space-y-1.5">
            {analysis.responsibilities.map((r, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-zinc-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.values(analysis.qualifications).some((q) => q.length) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Education", analysis.qualifications.education],
              ["Experience", analysis.qualifications.experience],
              ["Certifications", analysis.qualifications.certifications],
              ["Other requirements", analysis.qualifications.other],
            ] as const
          )
            .filter(([, items]) => items.length)
            .map(([label, items]) => (
              <div key={label}>
                <p className="mb-1.5 text-[12px] font-semibold text-zinc-400">{label}</p>
                <ul className="space-y-1 text-[12.5px] text-zinc-400">
                  {items.map((q, i) => <li key={i}>• {q}</li>)}
                </ul>
              </div>
            ))}
        </div>
      )}

      {keywordGroups.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-semibold text-zinc-400">ATS keywords</p>
          <div className="space-y-2.5">
            {keywordGroups.map(({ imp, items }) => (
              <div key={imp} className="flex flex-wrap items-center gap-1.5">
                <span className="w-24 shrink-0 text-[11px] uppercase tracking-wide text-zinc-600">
                  {IMPORTANCE_LABEL[imp]}
                </span>
                {items.map((k) => (
                  <Chip key={k.term} tone={imp === "required" ? "info" : "neutral"}>{k.term}</Chip>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-[#27272a] pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-white">Your profile vs. this job</p>
          {total > 0 && (
            <p className="text-[12px] text-zinc-500">
              Profile covers <span className="font-semibold text-zinc-200">{analysis.matchedSkills.length}</span> of{" "}
              <span className="font-semibold text-zinc-200">{total}</span> listed skills
            </p>
          )}
        </div>
        <SkillGapBlock analysis={analysis} />
      </div>
    </Card>
  );
}

// ─── Match panel (after generation) ───────────────────────────────────────────

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12.5px]">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-200">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1c1c1c]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function MatchPanel({
  breakdown,
  analysis,
  updating,
}: {
  breakdown: MatchBreakdown;
  analysis: JDAnalysis;
  updating?: boolean;
}) {
  const tone =
    breakdown.overall >= 75 ? "text-emerald-400" : breakdown.overall >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-5">
      <Card className={cn("transition-opacity", updating && "opacity-60")}>
        <CardTitle>Resume–JD Match Score</CardTitle>
        <div className="mb-5 flex items-end gap-2">
          <span className={cn("text-5xl font-bold tabular-nums", tone)}>{breakdown.overall}%</span>
        </div>
        <div className="space-y-3.5">
          <Bar label="Skills match" value={breakdown.skills} />
          <Bar label="Keyword match" value={breakdown.keywords} />
          <Bar label="Experience match" value={breakdown.experience} />
          <Bar label="Project match" value={breakdown.projects} />
          <Bar label="Education match" value={breakdown.education} />
        </div>
        <p className="mt-4 flex gap-2 text-[11.5px] leading-relaxed text-zinc-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          An estimate based on text overlap between this resume and the job description. It is not a score from any
          employer&apos;s applicant tracking system.
        </p>
      </Card>

      <Card>
        <CardTitle>Skills vs. this job</CardTitle>
        <SkillGapBlock analysis={analysis} />
      </Card>
    </div>
  );
}
