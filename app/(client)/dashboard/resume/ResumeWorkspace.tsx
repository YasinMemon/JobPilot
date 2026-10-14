"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  FileText,
  Plus,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RESUME_TEMPLATES,
  type JDAnalysis,
  type MatchBreakdown,
  type ResumeContent,
  type ResumeProfileData,
  type ResumeTemplateKey,
  type SavedResume,
  type SavedResumeSummary,
} from "@/types/resume";
import * as api from "./api";
import { cleanContent, cleanProfile } from "./helpers";
import GeneratorSetup, { type JDForm } from "./components/GeneratorSetup";
import ProfileEditor from "./components/ProfileEditor";
import ResumeEditor from "./components/ResumeEditor";
import ResumePreview from "./components/ResumePreview";
import MyResumes from "./components/MyResumes";
import { JDAnalysisPanel, MatchPanel } from "./components/Insights";
import { Btn, Card, LoadingSteps, Menu, MenuItem, TextInput } from "./components/ui";

type Tab = "generate" | "resumes" | "profile";
type Stage = "setup" | "analysis" | "editor";
type Busy = null | "loading-profile" | "analyzing" | "generating" | "saving" | "downloading" | "saving-profile";
type EditorPanel = "edit" | "preview" | "insights";

interface EditorState {
  content: ResumeContent;
  template: ResumeTemplateKey;
  name: string;
  savedId: string | null;
  matchBreakdown: MatchBreakdown;
}

const EMPTY_FORM: JDForm = { jobDescription: "", jobTitle: "", company: "", location: "", jobUrl: "" };

const ANALYZE_STEPS = ["Analyzing job description...", "Extracting skills...", "Finding important keywords..."];
const GENERATE_STEPS = [
  "Building your tailored resume...",
  "Selecting relevant experience...",
  "Optimizing resume content...",
  "Preparing ATS-friendly formatting...",
];

const FILE_EXT = /\.(pdf|docx|txt)$/i;
const MAX_FILE = 5 * 1024 * 1024;

const errMsg = (e: unknown, fallback = "Something went wrong. Please try again.") =>
  e instanceof Error && e.message ? e.message : fallback;

export default function ResumeWorkspace() {
  const [tab, setTab] = useState<Tab>("generate");
  const [stage, setStage] = useState<Stage>("setup");
  const [busy, setBusy] = useState<Busy>("loading-profile");
  const [error, setError] = useState<string | null>(null);

  // Profile
  const [profile, setProfile] = useState<ResumeProfileData | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState("");
  const [gaps, setGaps] = useState<string[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  // JD + analysis
  const [form, setForm] = useState<JDForm>(EMPTY_FORM);
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);

  // Editor
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [panel, setPanel] = useState<EditorPanel>("edit");
  const [matchUpdating, setMatchUpdating] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const lastMatched = useRef("");

  // Saved list
  const [resumes, setResumes] = useState<SavedResumeSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // ─── Profile loading ───────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setBusy("loading-profile");
    setProfileError(null);
    try {
      const res = await api.fetchProfile();
      setProfile(res.data);
      setProfileSnapshot(JSON.stringify(res.data));
      setGaps(res.gaps);
    } catch (e) {
      setProfileError(errMsg(e, "Couldn't load your profile."));
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .fetchProfile()
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setProfileSnapshot(JSON.stringify(res.data));
        setGaps(res.gaps);
      })
      .catch((e) => !cancelled && setProfileError(errMsg(e, "Couldn't load your profile.")))
      .finally(() => !cancelled && setBusy(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const profileDirty = profile !== null && JSON.stringify(profile) !== profileSnapshot;

  const persistProfile = useCallback(async (): Promise<boolean> => {
    if (!profile) return true;
    setBusy("saving-profile");
    try {
      const res = await api.saveProfile(cleanProfile(profile));
      setProfile(res.data);
      setProfileSnapshot(JSON.stringify(res.data));
      setGaps(res.gaps);
      toast.success("Profile saved.");
      return true;
    } catch (e) {
      toast.error(errMsg(e, "Couldn't save your profile."));
      return false;
    } finally {
      setBusy(null);
    }
  }, [profile]);

  const switchTab = async (next: Tab) => {
    if (next === tab) return;
    // Generation always reads the saved profile, so save pending edits first.
    if (tab === "profile" && profileDirty && !(await persistProfile())) return;
    setError(null);
    setTab(next);
  };

  // ─── Saved resumes ─────────────────────────────────────────────────────────
  const loadResumes = useCallback(async () => {
    setListError(null);
    try {
      setResumes(await api.listResumes());
    } catch (e) {
      setListError(errMsg(e, "Couldn't load your resumes."));
    }
  }, []);

  useEffect(() => {
    if (tab !== "resumes") return;
    let cancelled = false;
    api
      .listResumes()
      .then((rows) => !cancelled && (setResumes(rows), setListError(null)))
      .catch((e) => !cancelled && setListError(errMsg(e, "Couldn't load your resumes.")));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // ─── Editor helpers ────────────────────────────────────────────────────────
  const snapshotOf = (s: EditorState) =>
    JSON.stringify({ c: s.content, t: s.template, n: s.name });

  const editorDirty = editor !== null && snapshotOf(editor) !== savedSnapshot;

  useEffect(() => {
    if (!editorDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editorDirty]);

  // Recompute the match whenever the resume content changes (debounced).
  useEffect(() => {
    if (stage !== "editor" || !editor || !analysis) return;
    const key = JSON.stringify(editor.content);
    if (key === lastMatched.current) return;
    const t = setTimeout(async () => {
      setMatchUpdating(true);
      try {
        const res = await api.recomputeMatch(cleanContent(editor.content), analysis);
        lastMatched.current = key;
        setAnalysis(res.analysis);
        setEditor((prev) => (prev ? { ...prev, matchBreakdown: res.matchBreakdown } : prev));
      } catch {
        // Non-critical: keep the previous score
      } finally {
        setMatchUpdating(false);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [editor, stage, analysis]);

  const startEditor = (state: EditorState, saved: boolean) => {
    lastMatched.current = JSON.stringify(state.content);
    setSavedSnapshot(saved ? snapshotOf(state) : "");
    setEditor(state);
    setPanel("edit");
    setStage("editor");
    setTab("generate");
  };

  const resetFlow = () => {
    setForm(EMPTY_FORM);
    setAnalysis(null);
    setEditor(null);
    setError(null);
    setSavedSnapshot("");
    setStage("setup");
    setTab("generate");
  };

  const confirmLeave = () =>
    !editorDirty || window.confirm("You have unsaved changes to this resume. Leave without saving?");

  // ─── Actions ───────────────────────────────────────────────────────────────
  const applyAnalysis = (res: { analysis: JDAnalysis; jobDescription: string }) => {
    setAnalysis(res.analysis);
    setForm((f) => ({
      ...f,
      jobDescription: res.jobDescription,
      jobTitle: f.jobTitle || res.analysis.jobTitle,
      company: f.company || res.analysis.company,
      location: f.location || res.analysis.location,
    }));
    setStage("analysis");
  };

  const handleAnalyze = async () => {
    setError(null);
    if (!form.jobDescription.trim()) {
      setError("Paste a job description (or upload a file) to continue.");
      return;
    }
    setBusy("analyzing");
    try {
      applyAnalysis(
        await api.analyzeJD({
          jobDescription: form.jobDescription,
          jobTitle: form.jobTitle.trim() || undefined,
          company: form.company.trim() || undefined,
          location: form.location.trim() || undefined,
        }),
      );
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!FILE_EXT.test(file.name)) {
      setError("Unsupported file type. Please upload a .pdf, .docx or .txt file.");
      return;
    }
    if (file.size === 0) {
      setError("That file is empty.");
      return;
    }
    if (file.size > MAX_FILE) {
      setError("File is too large. The limit is 5 MB.");
      return;
    }
    setBusy("analyzing");
    try {
      applyAnalysis(
        await api.analyzeJDFile(file, {
          jobTitle: form.jobTitle.trim() || undefined,
          company: form.company.trim() || undefined,
          location: form.location.trim() || undefined,
        }),
      );
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const handleGenerate = async () => {
    if (!analysis) return;
    setError(null);
    setBusy("generating");
    try {
      const res = await api.generateResume(form.jobDescription, analysis);
      setAnalysis(res.analysis);
      const label = [res.analysis.jobTitle || form.jobTitle, form.company || res.analysis.company]
        .filter(Boolean)
        .join(" — ");
      startEditor(
        {
          content: res.content,
          template: "ats-classic",
          name: label || "Tailored resume",
          savedId: null,
          matchBreakdown: res.matchBreakdown,
        },
        false,
      );
    } catch (e) {
      if (e instanceof api.ResumeApiError && e.code === "PROFILE_INSUFFICIENT") {
        setGaps(e.details?.gaps ?? gaps);
        setStage("setup");
      }
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  /** Creates or updates the saved resume. Returns its id, or null on failure. */
  const handleSave = async (quiet = false): Promise<string | null> => {
    if (!editor || !analysis) return null;
    setBusy("saving");
    try {
      const content = cleanContent(editor.content);
      const payload = {
        name: editor.name.trim() || "Untitled resume",
        targetJobTitle: analysis.jobTitle || form.jobTitle,
        targetCompany: form.company || analysis.company,
        jobUrl: form.jobUrl,
        jobDescription: form.jobDescription,
        jdAnalysis: analysis,
        content,
        template: editor.template,
        matchScore: editor.matchBreakdown.overall,
        matchBreakdown: editor.matchBreakdown,
        missingSkills: analysis.missingSkills,
      };
      const saved: SavedResume = editor.savedId
        ? await api.updateResume(editor.savedId, payload)
        : await api.createResume(payload);
      const next: EditorState = { ...editor, content, savedId: saved._id };
      setEditor(next);
      setSavedSnapshot(snapshotOf(next));
      if (!quiet) toast.success("Resume saved.");
      return saved._id;
    } catch (e) {
      toast.error(errMsg(e, "Couldn't save the resume."));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!editor) return;
    // Exports render the saved version, so persist the latest edits first.
    const id = editorDirty || !editor.savedId ? await handleSave(true) : editor.savedId;
    if (!id) return;
    setBusy("downloading");
    try {
      await api.downloadResume(id, format, editor.name);
      toast.success(`${format.toUpperCase()} downloaded.`);
    } catch (e) {
      toast.error(errMsg(e, `Couldn't generate the ${format.toUpperCase()} file.`));
    } finally {
      setBusy(null);
    }
  };

  const openSaved = async (id: string) => {
    if (!confirmLeave()) return;
    setBusy("loading-profile");
    try {
      const r = await api.getResume(id);
      setForm({
        jobDescription: r.jobDescription,
        jobTitle: r.targetJobTitle,
        company: r.targetCompany,
        location: r.jdAnalysis.location,
        jobUrl: r.jobUrl,
      });
      setAnalysis(r.jdAnalysis);
      setError(null);
      startEditor(
        { content: r.content, template: r.template, name: r.name, savedId: r._id, matchBreakdown: r.matchBreakdown },
        true,
      );
    } catch (e) {
      toast.error(errMsg(e, "Couldn't open that resume."));
    } finally {
      setBusy(null);
    }
  };

  const listAction = {
    duplicate: async (id: string) => {
      try {
        await api.duplicateResume(id);
        toast.success("Resume duplicated.");
        await loadResumes();
      } catch (e) {
        toast.error(errMsg(e));
      }
    },
    rename: async (id: string, name: string) => {
      try {
        await api.updateResume(id, { name });
        setEditor((prev) => (prev?.savedId === id ? { ...prev, name } : prev));
        toast.success("Resume renamed.");
        await loadResumes();
      } catch (e) {
        toast.error(errMsg(e));
      }
    },
    remove: async (id: string) => {
      try {
        await api.deleteResume(id);
        if (editor?.savedId === id) resetFlow();
        toast.success("Resume deleted.");
        await loadResumes();
      } catch (e) {
        toast.error(errMsg(e));
      }
    },
    download: async (id: string, format: "pdf" | "docx", name: string) => {
      try {
        await api.downloadResume(id, format, name);
      } catch (e) {
        toast.error(errMsg(e, `Couldn't generate the ${format.toUpperCase()} file.`));
      }
    },
  };

  const isLongTask = busy === "analyzing" || busy === "generating";
  const profileSufficient = gaps.length === 0;

  const tabs: { key: Tab; label: string }[] = useMemo(
    () => [
      { key: "generate", label: "Generate" },
      { key: "resumes", label: "My Resumes" },
      { key: "profile", label: "Profile" },
    ],
    [],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full space-y-6 bg-[#0a0a0a] p-5 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-purple-600/20">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Resume Generator</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Tailor your resume to any job — using only what&apos;s in your profile.
            </p>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-[#27272a] bg-[#111111] p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => void switchTab(t.key)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
                tab === t.key
                  ? "border border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white"
                  : "border border-transparent text-zinc-500 hover:text-zinc-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-300/70 hover:text-rose-100" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* ── Profile tab ── */}
      {tab === "profile" &&
        (profile ? (
          <ProfileEditor
            profile={profile}
            onChange={setProfile}
            onSave={() => void persistProfile()}
            saving={busy === "saving-profile"}
            dirty={profileDirty}
          />
        ) : (
          <ProfileLoading error={profileError} onRetry={loadProfile} />
        ))}

      {/* ── My resumes tab ── */}
      {tab === "resumes" && (
        <>
          <div className="flex justify-end">
            <Btn variant="primary" onClick={() => { if (confirmLeave()) resetFlow(); }}>
              <Plus className="h-3.5 w-3.5" /> New tailored resume
            </Btn>
          </div>
          <MyResumes
            resumes={resumes}
            error={listError}
            onOpen={openSaved}
            onDuplicate={listAction.duplicate}
            onRename={listAction.rename}
            onDelete={listAction.remove}
            onDownload={listAction.download}
            onRetry={loadResumes}
            onCreate={() => { if (confirmLeave()) resetFlow(); }}
          />
        </>
      )}

      {/* ── Generate tab ── */}
      {tab === "generate" && (
        <>
          {busy === "loading-profile" && !profile && <ProfileLoading error={profileError} onRetry={loadProfile} />}
          {profileError && !profile && busy !== "loading-profile" && (
            <ProfileLoading error={profileError} onRetry={loadProfile} />
          )}

          {isLongTask && (
            <LoadingSteps
              title={busy === "analyzing" ? "Analyzing" : "Generating"}
              steps={busy === "analyzing" ? ANALYZE_STEPS : GENERATE_STEPS}
            />
          )}

          {!isLongTask && profile && stage === "setup" && !profileSufficient && (
            <Card className="mx-auto max-w-xl space-y-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-white">Your profile needs more information.</h2>
                <p className="mt-2 text-[13px] text-zinc-500">
                  We never invent content, so we need real details to work with. Add:
                </p>
              </div>
              <ul className="mx-auto w-fit space-y-1.5 text-left">
                {gaps.map((g) => (
                  <li key={g} className="flex items-center gap-2 text-[13.5px] text-zinc-200">
                    <Check className="h-4 w-4 text-emerald-400" /> {g}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-zinc-500">Then we&apos;ll generate your tailored resume.</p>
              <Btn variant="primary" onClick={() => void switchTab("profile")}>Complete Profile</Btn>
            </Card>
          )}

          {!isLongTask && profile && stage === "setup" && profileSufficient && (
            <GeneratorSetup
              profile={profile}
              form={form}
              onChange={setForm}
              onAnalyze={handleAnalyze}
              onFile={handleFile}
              onEditProfile={() => void switchTab("profile")}
              busy={busy !== null}
            />
          )}

          {!isLongTask && stage === "analysis" && analysis && (
            <div className="space-y-5">
              <JDAnalysisPanel analysis={analysis} />
              <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <Btn variant="ghost" onClick={() => { setStage("setup"); setError(null); }}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit job description
                </Btn>
                <Btn variant="primary" onClick={handleGenerate} loading={busy !== null} className="px-5 py-2.5">
                  Generate tailored resume
                </Btn>
              </div>
            </div>
          )}

          {!isLongTask && stage === "editor" && editor && analysis && (
            <div className="space-y-5">
              {/* Toolbar */}
              <Card className="space-y-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <Btn variant="ghost" onClick={() => { if (confirmLeave()) resetFlow(); }} className="self-start">
                    <ArrowLeft className="h-3.5 w-3.5" /> New
                  </Btn>
                  <TextInput
                    value={editor.name}
                    maxLength={140}
                    aria-label="Resume name"
                    onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                    className="lg:max-w-sm"
                  />
                  <div className="flex-1" />
                  {editorDirty && <span className="text-[12px] text-amber-400">Unsaved changes</span>}
                  <div className="flex gap-2">
                    <Btn onClick={() => void handleSave()} loading={busy === "saving"} disabled={busy !== null && busy !== "saving"}>
                      <Save className="h-3.5 w-3.5" /> {editor.savedId ? "Save" : "Save resume"}
                    </Btn>
                    <Menu
                      trigger={({ toggle }) => (
                        <Btn variant="primary" onClick={toggle} loading={busy === "downloading"} disabled={busy !== null && busy !== "downloading"}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Btn>
                      )}
                    >
                      {(close) => (
                        <>
                          <MenuItem onClick={() => { close(); void handleDownload("pdf"); }}>PDF (recommended for ATS)</MenuItem>
                          <MenuItem onClick={() => { close(); void handleDownload("docx"); }}>Word (.docx, editable)</MenuItem>
                        </>
                      )}
                    </Menu>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">Template</span>
                  {RESUME_TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      title={t.description}
                      onClick={() => setEditor({ ...editor, template: t.key })}
                      className={cn(
                        "rounded-lg border px-3 py-1 text-[12.5px] font-medium transition-all",
                        editor.template === t.key
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                          : "border-[#27272a] text-zinc-500 hover:border-[#3f3f46] hover:text-zinc-200",
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                  <span className="ml-auto rounded-lg border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[12px] font-semibold text-blue-300">
                    {editor.matchBreakdown.overall}% match
                  </span>
                </div>
              </Card>

              {/* Panel switcher (below xl) */}
              <div className="flex gap-1 rounded-xl border border-[#27272a] bg-[#111111] p-1 xl:hidden">
                {(["edit", "preview", "insights"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPanel(p)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium capitalize transition-all",
                      panel === p ? "bg-[#1c1c1c] text-white" : "text-zinc-500 hover:text-zinc-200",
                    )}
                  >
                    {p === "insights" ? "Match" : p}
                  </button>
                ))}
              </div>

              <div className="grid items-start gap-6 xl:grid-cols-2">
                <div className="min-w-0 space-y-5">
                  {/* xl: Edit/Match toggle lives here */}
                  <div className="hidden gap-1 rounded-xl border border-[#27272a] bg-[#111111] p-1 xl:flex">
                    {(["edit", "insights"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPanel(p)}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                          (panel === p || (p === "edit" && panel === "preview"))
                            ? "bg-[#1c1c1c] text-white"
                            : "text-zinc-500 hover:text-zinc-200",
                        )}
                      >
                        {p === "edit" ? "Edit" : "Match & gaps"}
                      </button>
                    ))}
                  </div>

                  <div className={cn(panel === "edit" ? "block" : panel === "preview" ? "hidden xl:block" : "hidden")}>
                    <ResumeEditor
                      content={editor.content}
                      onChange={(content) => setEditor({ ...editor, content })}
                      analysis={analysis}
                    />
                  </div>
                  <div className={cn(panel === "insights" ? "block" : "hidden")}>
                    <MatchPanel breakdown={editor.matchBreakdown} analysis={analysis} updating={matchUpdating} />
                  </div>
                </div>

                <div className={cn("min-w-0 xl:sticky xl:top-6", panel === "preview" ? "block" : "hidden xl:block")}>
                  <ResumePreview content={cleanContent(editor.content)} template={editor.template} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileLoading({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-[13px] text-zinc-400">{error}</p>
        <Btn onClick={onRetry}>Try again</Btn>
      </Card>
    );
  }
  return <div className="h-48 animate-pulse rounded-2xl border border-[#27272a] bg-[#111111]" />;
}
