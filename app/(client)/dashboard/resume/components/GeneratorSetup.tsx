"use client";

import { useRef } from "react";
import { CheckCircle2, Upload, UserRound } from "lucide-react";
import { flatSkillCount } from "../helpers";
import type { ResumeProfileData } from "@/types/resume";
import { Btn, Card, CardTitle, Field, TextArea, TextInput } from "./ui";

export interface JDForm {
  jobDescription: string;
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
}

interface Props {
  profile: ResumeProfileData;
  form: JDForm;
  onChange: (next: JDForm) => void;
  onAnalyze: () => void;
  onFile: (file: File) => void;
  onEditProfile: () => void;
  busy: boolean;
}

const ACCEPT = ".pdf,.docx,.txt";

/** Step 1: choose the profile and provide the job description. */
export default function GeneratorSetup({ profile, form, onChange, onAnalyze, onFile, onEditProfile, busy }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<JDForm>) => onChange({ ...form, ...patch });

  const roles = profile.experience.filter((e) => e.company.trim()).length;
  const projects = profile.projects.filter((p) => p.name.trim()).length;
  const skills = flatSkillCount(profile);

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle
          right={<Btn variant="ghost" onClick={onEditProfile}>Edit profile</Btn>}
        >
          1. Select profile
        </CardTitle>
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
            <UserRound className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-white">
              {profile.personal.fullName || "My resume profile"}
            </p>
            <p className="text-[12px] text-zinc-500">
              {roles} {roles === 1 ? "role" : "roles"} · {projects} {projects === 1 ? "project" : "projects"} · {skills} skills
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-400" />
        </div>
      </Card>

      <Card>
        <CardTitle>2. Job description</CardTitle>
        <div className="space-y-4">
          <Field label="Paste the job description">
            <TextArea
              rows={12}
              value={form.jobDescription}
              placeholder="Paste the full job posting here…"
              onChange={(e) => set({ jobDescription: e.target.value })}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onFile(f);
              }}
            />
            <Btn onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="h-3.5 w-3.5" /> Upload JD (.pdf, .docx, .txt)
            </Btn>
            <span className="text-[11.5px] text-zinc-600">Max 5 MB. The file is read in memory and not stored.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job title (optional)">
              <TextInput value={form.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} />
            </Field>
            <Field label="Company (optional)">
              <TextInput value={form.company} onChange={(e) => set({ company: e.target.value })} />
            </Field>
            <Field label="Location (optional)">
              <TextInput value={form.location} onChange={(e) => set({ location: e.target.value })} />
            </Field>
            <Field label="Job URL (optional)">
              <TextInput type="url" value={form.jobUrl} placeholder="https://…" onChange={(e) => set({ jobUrl: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Btn variant="primary" onClick={onAnalyze} loading={busy} className="px-5 py-2.5">
          Analyze job description
        </Btn>
      </div>
    </div>
  );
}
