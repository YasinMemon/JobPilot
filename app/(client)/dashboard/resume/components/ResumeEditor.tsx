"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionHasContent } from "@/lib/resume/layout";
import {
  IMPROVE_ACTIONS,
  SECTION_LABELS,
  type ImproveAction,
  type JDAnalysis,
  type ResumeContent,
  type ResumeSectionKey,
} from "@/types/resume";
import { improveText } from "../api";
import {
  Btn,
  Card,
  ChipInput,
  Field,
  IconBtn,
  Menu,
  MenuItem,
  TextArea,
  TextInput,
  uid,
} from "./ui";

interface Props {
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  analysis: JDAnalysis;
}

const BULLET_ACTIONS: ImproveAction[] = ["improve", "concise", "ats", "technical", "leadership", "relevant", "stronger"];
const SUMMARY_ACTIONS: ImproveAction[] = ["rewrite-summary", "improve", "concise", "ats", "relevant"];

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

/** Sparkle menu that rewrites one piece of text with the AI, with undo. */
function AiMenu({
  text,
  actions,
  target,
  analysis,
  onApply,
}: {
  text: string;
  actions: ImproveAction[];
  target: { section: "summary" | "experience" | "projects"; itemId?: string };
  analysis: JDAnalysis;
  onApply: (next: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const run = async (action: ImproveAction, close: () => void) => {
    close();
    if (!text.trim()) {
      toast.info("Write something first, then ask the AI to improve it.");
      return;
    }
    setBusy(true);
    try {
      const { text: improved } = await improveText({ action, text, target, analysis });
      const previous = text;
      onApply(improved);
      toast.success("Updated", { action: { label: "Undo", onClick: () => onApply(previous) } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The AI request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Menu
      trigger={({ toggle }) => (
        <IconBtn label="Improve with AI" onClick={toggle} disabled={busy} className="text-purple-400 hover:text-purple-300">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        </IconBtn>
      )}
    >
      {(close) => (
        <>
          {actions.map((key) => (
            <MenuItem key={key} onClick={() => run(key, close)}>
              {IMPROVE_ACTIONS.find((a) => a.key === key)?.label}
            </MenuItem>
          ))}
          <p className="px-3 pb-2 pt-1 text-[10.5px] leading-snug text-zinc-600">
            Only uses facts from your profile.
          </p>
        </>
      )}
    </Menu>
  );
}

function BulletList({
  bullets,
  onChange,
  target,
  analysis,
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
  target: { section: "experience" | "projects"; itemId: string };
  analysis: JDAnalysis;
}) {
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-2 text-zinc-600">•</span>
          <TextArea
            rows={2}
            value={b}
            onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
            className="min-h-0 flex-1"
          />
          <div className="flex flex-col">
            <AiMenu
              text={b}
              actions={BULLET_ACTIONS}
              target={target}
              analysis={analysis}
              onApply={(next) => onChange(bullets.map((x, j) => (j === i ? next : x)))}
            />
            <IconBtn label="Remove bullet" onClick={() => onChange(bullets.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </div>
      ))}
      <Btn variant="ghost" onClick={() => onChange([...bullets, ""])} className="!px-2 !py-1 text-[12px]">
        <Plus className="h-3 w-3" /> Add bullet
      </Btn>
    </div>
  );
}

function ItemCard({
  children,
  index,
  count,
  onMove,
  onRemove,
}: {
  children: React.ReactNode;
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-[#27272a] bg-[#0f0f0f] p-3.5">
      <div className="-mb-1 flex justify-end gap-0.5">
        <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
        <IconBtn label="Remove" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
      </div>
      {children}
    </div>
  );
}

const BLANK_ITEM: Record<ResumeSectionKey, (c: ResumeContent) => ResumeContent> = {
  summary: (c) => c,
  experience: (c) => ({
    ...c,
    experience: [...c.experience, { id: uid(), company: "", title: "", employmentType: "", location: "", startDate: "", endDate: "", current: false, bullets: [""] }],
  }),
  projects: (c) => ({ ...c, projects: [...c.projects, { id: uid(), name: "", technologies: [], url: "", githubUrl: "", bullets: [""] }] }),
  skills: (c) => ({ ...c, skills: [...c.skills, { id: uid(), category: "Skills", items: [] }] }),
  education: (c) => ({ ...c, education: [...c.education, { id: uid(), institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "" }] }),
  certifications: (c) => ({ ...c, certifications: [...c.certifications, { id: uid(), name: "", issuer: "", date: "", url: "" }] }),
  achievements: (c) => ({ ...c, achievements: [...c.achievements, { id: uid(), title: "", description: "" }] }),
};

const CLEARED: Record<ResumeSectionKey, Partial<ResumeContent>> = {
  summary: { summary: "" },
  experience: { experience: [] },
  projects: { projects: [] },
  skills: { skills: [] },
  education: { education: [] },
  certifications: { certifications: [] },
  achievements: { achievements: [] },
};

export default function ResumeEditor({ content, onChange, analysis }: Props) {
  const set = (patch: Partial<ResumeContent>) => onChange({ ...content, ...patch });
  const hidden = new Set(content.hiddenSections);

  const toggleHidden = (key: ResumeSectionKey) =>
    set({ hiddenSections: hidden.has(key) ? content.hiddenSections.filter((k) => k !== key) : [...content.hiddenSections, key] });

  const deleteSection = (key: ResumeSectionKey) =>
    onChange({
      ...content,
      ...CLEARED[key],
      hiddenSections: hidden.has(key) ? content.hiddenSections : [...content.hiddenSections, key],
    });

  const addSection = (key: ResumeSectionKey) => {
    let next: ResumeContent = {
      ...content,
      hiddenSections: content.hiddenSections.filter((k) => k !== key),
    };
    if (!sectionHasContent(next, key)) next = BLANK_ITEM[key](next);
    onChange(next);
  };

  const addable = content.sectionOrder.filter((k) => hidden.has(k) || !sectionHasContent(content, k));

  const body = (key: ResumeSectionKey) => {
    switch (key) {
      case "summary":
        return (
          <div className="space-y-2">
            <TextArea rows={4} value={content.summary} onChange={(e) => set({ summary: e.target.value })} />
            <div className="flex items-center justify-end gap-2 text-[11.5px] text-zinc-600">
              Improve with AI
              <AiMenu text={content.summary} actions={SUMMARY_ACTIONS} target={{ section: "summary" }} analysis={analysis} onApply={(v) => set({ summary: v })} />
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="space-y-3">
            {content.experience.map((e, i) => {
              const upd = (patch: Partial<typeof e>) => set({ experience: content.experience.map((x) => (x.id === e.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={e.id} index={i} count={content.experience.length}
                  onMove={(d) => set({ experience: move(content.experience, i, d) })}
                  onRemove={() => set({ experience: content.experience.filter((x) => x.id !== e.id) })}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Job title"><TextInput value={e.title} onChange={(ev) => upd({ title: ev.target.value })} /></Field>
                    <Field label="Company"><TextInput value={e.company} onChange={(ev) => upd({ company: ev.target.value })} /></Field>
                    <Field label="Start"><TextInput value={e.startDate} onChange={(ev) => upd({ startDate: ev.target.value })} /></Field>
                    <Field label="End"><TextInput value={e.current ? "" : e.endDate} disabled={e.current} placeholder={e.current ? "Present" : ""} onChange={(ev) => upd({ endDate: ev.target.value })} /></Field>
                  </div>
                  <label className="flex items-center gap-2 text-[12.5px] text-zinc-400">
                    <input type="checkbox" checked={e.current} onChange={(ev) => upd({ current: ev.target.checked })} className="accent-blue-500" /> Current role
                  </label>
                  <BulletList bullets={e.bullets} onChange={(b) => upd({ bullets: b })} target={{ section: "experience", itemId: e.id }} analysis={analysis} />
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.experience(content))}><Plus className="h-3.5 w-3.5" /> Add experience</Btn>
          </div>
        );

      case "projects":
        return (
          <div className="space-y-3">
            {content.projects.map((p, i) => {
              const upd = (patch: Partial<typeof p>) => set({ projects: content.projects.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={p.id} index={i} count={content.projects.length}
                  onMove={(d) => set({ projects: move(content.projects, i, d) })}
                  onRemove={() => set({ projects: content.projects.filter((x) => x.id !== p.id) })}>
                  <Field label="Project name"><TextInput value={p.name} onChange={(ev) => upd({ name: ev.target.value })} /></Field>
                  <Field label="Technologies"><ChipInput value={p.technologies} onChange={(v) => upd({ technologies: v })} /></Field>
                  <BulletList bullets={p.bullets} onChange={(b) => upd({ bullets: b })} target={{ section: "projects", itemId: p.id }} analysis={analysis} />
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.projects(content))}><Plus className="h-3.5 w-3.5" /> Add project</Btn>
          </div>
        );

      case "skills":
        return (
          <div className="space-y-3">
            {content.skills.map((g, i) => {
              const upd = (patch: Partial<typeof g>) => set({ skills: content.skills.map((x) => (x.id === g.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={g.id} index={i} count={content.skills.length}
                  onMove={(d) => set({ skills: move(content.skills, i, d) })}
                  onRemove={() => set({ skills: content.skills.filter((x) => x.id !== g.id) })}>
                  <Field label="Category"><TextInput value={g.category} onChange={(ev) => upd({ category: ev.target.value })} /></Field>
                  <Field label="Skills (most relevant first)"><ChipInput value={g.items} onChange={(v) => upd({ items: v })} /></Field>
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.skills(content))}><Plus className="h-3.5 w-3.5" /> Add skill group</Btn>
          </div>
        );

      case "education":
        return (
          <div className="space-y-3">
            {content.education.map((e, i) => {
              const upd = (patch: Partial<typeof e>) => set({ education: content.education.map((x) => (x.id === e.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={e.id} index={i} count={content.education.length}
                  onMove={(d) => set({ education: move(content.education, i, d) })}
                  onRemove={() => set({ education: content.education.filter((x) => x.id !== e.id) })}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Institution" className="sm:col-span-2"><TextInput value={e.institution} onChange={(ev) => upd({ institution: ev.target.value })} /></Field>
                    <Field label="Degree"><TextInput value={e.degree} onChange={(ev) => upd({ degree: ev.target.value })} /></Field>
                    <Field label="Field"><TextInput value={e.field} onChange={(ev) => upd({ field: ev.target.value })} /></Field>
                    <Field label="Start"><TextInput value={e.startDate} onChange={(ev) => upd({ startDate: ev.target.value })} /></Field>
                    <Field label="End"><TextInput value={e.endDate} onChange={(ev) => upd({ endDate: ev.target.value })} /></Field>
                    <Field label="GPA / percentage"><TextInput value={e.grade} onChange={(ev) => upd({ grade: ev.target.value })} /></Field>
                  </div>
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.education(content))}><Plus className="h-3.5 w-3.5" /> Add education</Btn>
          </div>
        );

      case "certifications":
        return (
          <div className="space-y-3">
            {content.certifications.map((c, i) => {
              const upd = (patch: Partial<typeof c>) => set({ certifications: content.certifications.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={c.id} index={i} count={content.certifications.length}
                  onMove={(d) => set({ certifications: move(content.certifications, i, d) })}
                  onRemove={() => set({ certifications: content.certifications.filter((x) => x.id !== c.id) })}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name" className="sm:col-span-3"><TextInput value={c.name} onChange={(ev) => upd({ name: ev.target.value })} /></Field>
                    <Field label="Issuer" className="sm:col-span-2"><TextInput value={c.issuer} onChange={(ev) => upd({ issuer: ev.target.value })} /></Field>
                    <Field label="Date"><TextInput value={c.date} onChange={(ev) => upd({ date: ev.target.value })} /></Field>
                  </div>
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.certifications(content))}><Plus className="h-3.5 w-3.5" /> Add certification</Btn>
          </div>
        );

      case "achievements":
        return (
          <div className="space-y-3">
            {content.achievements.map((a, i) => {
              const upd = (patch: Partial<typeof a>) => set({ achievements: content.achievements.map((x) => (x.id === a.id ? { ...x, ...patch } : x)) });
              return (
                <ItemCard key={a.id} index={i} count={content.achievements.length}
                  onMove={(d) => set({ achievements: move(content.achievements, i, d) })}
                  onRemove={() => set({ achievements: content.achievements.filter((x) => x.id !== a.id) })}>
                  <Field label="Title"><TextInput value={a.title} onChange={(ev) => upd({ title: ev.target.value })} /></Field>
                  <Field label="Description"><TextArea rows={2} value={a.description} onChange={(ev) => upd({ description: ev.target.value })} /></Field>
                </ItemCard>
              );
            })}
            <Btn variant="secondary" onClick={() => onChange(BLANK_ITEM.achievements(content))}><Plus className="h-3.5 w-3.5" /> Add achievement</Btn>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {content.sectionOrder.map((key, index) => {
        const isHidden = hidden.has(key);
        return (
          <Card key={key} className={cn("p-4", isHidden && "opacity-60")}>
            <div className={cn("flex items-center justify-between gap-2", !isHidden && "mb-3")}>
              <h3 className="text-[13.5px] font-semibold text-white">
                {SECTION_LABELS[key]}
                {isHidden && <span className="ml-2 text-[11px] font-normal text-zinc-500">hidden from resume</span>}
              </h3>
              <div className="flex items-center gap-0.5">
                <IconBtn label="Move section up" disabled={index === 0} onClick={() => set({ sectionOrder: move(content.sectionOrder, index, -1) })}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn label="Move section down" disabled={index === content.sectionOrder.length - 1} onClick={() => set({ sectionOrder: move(content.sectionOrder, index, 1) })}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn label={isHidden ? "Show section" : "Hide section"} onClick={() => toggleHidden(key)}>
                  {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </IconBtn>
                <IconBtn label="Delete section content" onClick={() => deleteSection(key)} className="hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
              </div>
            </div>
            {!isHidden && body(key)}
          </Card>
        );
      })}

      {addable.length > 0 && (
        <Menu
          align="left"
          trigger={({ toggle }) => (
            <Btn variant="secondary" onClick={toggle}><Plus className="h-3.5 w-3.5" /> Add section</Btn>
          )}
        >
          {(close) =>
            addable.map((k) => (
              <MenuItem key={k} onClick={() => { addSection(k); close(); }}>{SECTION_LABELS[k]}</MenuItem>
            ))
          }
        </Menu>
      )}
    </div>
  );
}
