"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  type ResumeProfileData,
} from "@/types/resume";
import {
  Btn,
  Card,
  CardTitle,
  ChipInput,
  Field,
  IconBtn,
  TextArea,
  TextInput,
  uid,
} from "./ui";

interface Props {
  profile: ResumeProfileData;
  onChange: (next: ResumeProfileData) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}

/** Editable list helper: renders each item with a delete button. */
function ItemShell({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="relative space-y-3 rounded-xl border border-[#27272a] bg-[#0f0f0f] p-4">
      <div className="absolute right-2 top-2">
        <IconBtn label="Remove" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
      {children}
    </div>
  );
}

const lines = (v: string[]) => v.join("\n");
const fromLines = (v: string) => v.split("\n");

export default function ProfileEditor({ profile, onChange, onSave, saving, dirty }: Props) {
  const set = <K extends keyof ResumeProfileData>(key: K, value: ResumeProfileData[K]) =>
    onChange({ ...profile, [key]: value });

  const setPersonal = (patch: Partial<ResumeProfileData["personal"]>) =>
    set("personal", { ...profile.personal, ...patch });

  const patchAt = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
    list.map((x) => (x.id === id ? { ...x, ...patch } : x));

  const p = profile.personal;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-zinc-500">
          This is the only information the AI can use. It never invents skills, roles or
          metrics — if something isn&apos;t here, it won&apos;t appear on your resume.
        </p>
        <Btn variant="primary" onClick={onSave} loading={saving} disabled={!dirty} className="shrink-0">
          {dirty ? "Save profile" : "Saved"}
        </Btn>
      </div>

      {/* Personal */}
      <Card>
        <CardTitle>Personal information</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput value={p.fullName} onChange={(e) => setPersonal({ fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={p.email} onChange={(e) => setPersonal({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <TextInput value={p.phone} onChange={(e) => setPersonal({ phone: e.target.value })} />
          </Field>
          <Field label="Location">
            <TextInput value={p.location} onChange={(e) => setPersonal({ location: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <TextInput value={p.linkedin} placeholder="linkedin.com/in/…" onChange={(e) => setPersonal({ linkedin: e.target.value })} />
          </Field>
          <Field label="GitHub">
            <TextInput value={p.github} placeholder="github.com/…" onChange={(e) => setPersonal({ github: e.target.value })} />
          </Field>
          <Field label="Portfolio" className="sm:col-span-2">
            <TextInput value={p.portfolio} onChange={(e) => setPersonal({ portfolio: e.target.value })} />
          </Field>
        </div>
        {p.otherLinks.map((l, i) => (
          <div key={i} className="mt-3 grid grid-cols-[1fr_2fr_auto] items-end gap-2">
            <Field label="Label">
              <TextInput value={l.label} onChange={(e) => setPersonal({ otherLinks: p.otherLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            </Field>
            <Field label="URL">
              <TextInput value={l.url} onChange={(e) => setPersonal({ otherLinks: p.otherLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
            </Field>
            <IconBtn label="Remove link" onClick={() => setPersonal({ otherLinks: p.otherLinks.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        ))}
        {p.otherLinks.length < 10 && (
          <Btn variant="ghost" className="mt-3" onClick={() => setPersonal({ otherLinks: [...p.otherLinks, { label: "", url: "" }] })}>
            <Plus className="h-3.5 w-3.5" /> Add link
          </Btn>
        )}
      </Card>

      {/* Summary */}
      <Card>
        <CardTitle>Professional summary</CardTitle>
        <TextArea
          rows={4}
          value={profile.summary}
          placeholder="Optional. A short factual summary of your background — the AI rewrites it per job."
          onChange={(e) => set("summary", e.target.value)}
        />
      </Card>

      {/* Experience */}
      <Card>
        <CardTitle
          right={
            <Btn
              variant="secondary"
              onClick={() =>
                set("experience", [
                  ...profile.experience,
                  { id: uid(), company: "", title: "", employmentType: "", location: "", startDate: "", endDate: "", current: false, description: "", achievements: [], technologies: [] },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          }
        >
          Work experience
        </CardTitle>
        <div className="space-y-3">
          {profile.experience.length === 0 && (
            <p className="text-[12.5px] text-zinc-600">No experience added yet.</p>
          )}
          {profile.experience.map((e) => {
            const upd = (patch: Partial<typeof e>) => set("experience", patchAt(profile.experience, e.id, patch));
            return (
              <ItemShell key={e.id} onRemove={() => set("experience", profile.experience.filter((x) => x.id !== e.id))}>
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field label="Job title"><TextInput value={e.title} onChange={(ev) => upd({ title: ev.target.value })} /></Field>
                  <Field label="Company"><TextInput value={e.company} onChange={(ev) => upd({ company: ev.target.value })} /></Field>
                  <Field label="Employment type"><TextInput value={e.employmentType} placeholder="Full-time, Internship…" onChange={(ev) => upd({ employmentType: ev.target.value })} /></Field>
                  <Field label="Location"><TextInput value={e.location} onChange={(ev) => upd({ location: ev.target.value })} /></Field>
                  <Field label="Start date"><TextInput value={e.startDate} placeholder="Jan 2023" onChange={(ev) => upd({ startDate: ev.target.value })} /></Field>
                  <Field label="End date"><TextInput value={e.current ? "" : e.endDate} disabled={e.current} placeholder={e.current ? "Present" : "Dec 2024"} onChange={(ev) => upd({ endDate: ev.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2 text-[12.5px] text-zinc-400">
                  <input type="checkbox" checked={e.current} onChange={(ev) => upd({ current: ev.target.checked })} className="accent-blue-500" />
                  I currently work here
                </label>
                <Field label="Description" hint="What you did in this role. Be factual — the AI only rephrases what you write.">
                  <TextArea rows={3} value={e.description} onChange={(ev) => upd({ description: ev.target.value })} />
                </Field>
                <Field label="Achievements" hint="One per line. Include metrics only if they are real.">
                  <TextArea rows={3} value={lines(e.achievements)} onChange={(ev) => upd({ achievements: fromLines(ev.target.value) })} />
                </Field>
                <Field label="Technologies used">
                  <ChipInput value={e.technologies} onChange={(v) => upd({ technologies: v })} placeholder="React, Node.js…" />
                </Field>
              </ItemShell>
            );
          })}
        </div>
      </Card>

      {/* Education */}
      <Card>
        <CardTitle
          right={
            <Btn variant="secondary" onClick={() => set("education", [...profile.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          }
        >
          Education
        </CardTitle>
        <div className="space-y-3">
          {profile.education.length === 0 && <p className="text-[12.5px] text-zinc-600">No education added yet.</p>}
          {profile.education.map((e) => {
            const upd = (patch: Partial<typeof e>) => set("education", patchAt(profile.education, e.id, patch));
            return (
              <ItemShell key={e.id} onRemove={() => set("education", profile.education.filter((x) => x.id !== e.id))}>
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field label="Institution" className="sm:col-span-2"><TextInput value={e.institution} onChange={(ev) => upd({ institution: ev.target.value })} /></Field>
                  <Field label="Degree"><TextInput value={e.degree} placeholder="B.Tech" onChange={(ev) => upd({ degree: ev.target.value })} /></Field>
                  <Field label="Field of study"><TextInput value={e.field} onChange={(ev) => upd({ field: ev.target.value })} /></Field>
                  <Field label="Start"><TextInput value={e.startDate} onChange={(ev) => upd({ startDate: ev.target.value })} /></Field>
                  <Field label="End"><TextInput value={e.endDate} onChange={(ev) => upd({ endDate: ev.target.value })} /></Field>
                  <Field label="GPA / percentage"><TextInput value={e.grade} onChange={(ev) => upd({ grade: ev.target.value })} /></Field>
                </div>
              </ItemShell>
            );
          })}
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <CardTitle>Skills</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {SKILL_CATEGORIES.map((cat) => (
            <Field key={cat} label={SKILL_CATEGORY_LABELS[cat]}>
              <ChipInput
                value={profile.skills[cat]}
                onChange={(v) => set("skills", { ...profile.skills, [cat]: v })}
                placeholder="Type and press Enter"
              />
            </Field>
          ))}
        </div>
      </Card>

      {/* Projects */}
      <Card>
        <CardTitle
          right={
            <Btn variant="secondary" onClick={() => set("projects", [...profile.projects, { id: uid(), name: "", description: "", technologies: [], responsibilities: [], achievements: [], url: "", githubUrl: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          }
        >
          Projects
        </CardTitle>
        <div className="space-y-3">
          {profile.projects.length === 0 && <p className="text-[12.5px] text-zinc-600">No projects added yet.</p>}
          {profile.projects.map((pr) => {
            const upd = (patch: Partial<typeof pr>) => set("projects", patchAt(profile.projects, pr.id, patch));
            return (
              <ItemShell key={pr.id} onRemove={() => set("projects", profile.projects.filter((x) => x.id !== pr.id))}>
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field label="Project name" className="sm:col-span-2"><TextInput value={pr.name} onChange={(ev) => upd({ name: ev.target.value })} /></Field>
                  <Field label="Project URL"><TextInput value={pr.url} onChange={(ev) => upd({ url: ev.target.value })} /></Field>
                  <Field label="GitHub URL"><TextInput value={pr.githubUrl} onChange={(ev) => upd({ githubUrl: ev.target.value })} /></Field>
                </div>
                <Field label="Description"><TextArea rows={3} value={pr.description} onChange={(ev) => upd({ description: ev.target.value })} /></Field>
                <Field label="Technologies"><ChipInput value={pr.technologies} onChange={(v) => upd({ technologies: v })} placeholder="Next.js, MongoDB…" /></Field>
                <Field label="Responsibilities" hint="One per line"><TextArea rows={3} value={lines(pr.responsibilities)} onChange={(ev) => upd({ responsibilities: fromLines(ev.target.value) })} /></Field>
                <Field label="Achievements" hint="One per line"><TextArea rows={2} value={lines(pr.achievements)} onChange={(ev) => upd({ achievements: fromLines(ev.target.value) })} /></Field>
              </ItemShell>
            );
          })}
        </div>
      </Card>

      {/* Certifications */}
      <Card>
        <CardTitle
          right={
            <Btn variant="secondary" onClick={() => set("certifications", [...profile.certifications, { id: uid(), name: "", issuer: "", date: "", url: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          }
        >
          Certifications
        </CardTitle>
        <div className="space-y-3">
          {profile.certifications.length === 0 && <p className="text-[12.5px] text-zinc-600">No certifications added yet.</p>}
          {profile.certifications.map((c) => {
            const upd = (patch: Partial<typeof c>) => set("certifications", patchAt(profile.certifications, c.id, patch));
            return (
              <ItemShell key={c.id} onRemove={() => set("certifications", profile.certifications.filter((x) => x.id !== c.id))}>
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field label="Name"><TextInput value={c.name} onChange={(ev) => upd({ name: ev.target.value })} /></Field>
                  <Field label="Issuer"><TextInput value={c.issuer} onChange={(ev) => upd({ issuer: ev.target.value })} /></Field>
                  <Field label="Date"><TextInput value={c.date} onChange={(ev) => upd({ date: ev.target.value })} /></Field>
                  <Field label="Credential URL"><TextInput value={c.url} onChange={(ev) => upd({ url: ev.target.value })} /></Field>
                </div>
              </ItemShell>
            );
          })}
        </div>
      </Card>

      {/* Achievements */}
      <Card>
        <CardTitle
          right={
            <Btn variant="secondary" onClick={() => set("achievements", [...profile.achievements, { id: uid(), title: "", description: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Btn>
          }
        >
          Achievements
        </CardTitle>
        <div className="space-y-3">
          {profile.achievements.length === 0 && <p className="text-[12.5px] text-zinc-600">No achievements added yet.</p>}
          {profile.achievements.map((a) => {
            const upd = (patch: Partial<typeof a>) => set("achievements", patchAt(profile.achievements, a.id, patch));
            return (
              <ItemShell key={a.id} onRemove={() => set("achievements", profile.achievements.filter((x) => x.id !== a.id))}>
                <div className="space-y-3 pr-8">
                  <Field label="Title"><TextInput value={a.title} onChange={(ev) => upd({ title: ev.target.value })} /></Field>
                  <Field label="Description"><TextArea rows={2} value={a.description} onChange={(ev) => upd({ description: ev.target.value })} /></Field>
                </div>
              </ItemShell>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
