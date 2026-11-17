"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { RichEmailEditor } from "@/app/(client)/dashboard/components/RichEmailEditor";
import {
  useGenerateDraft,
  useSaveDraft,
  useSendFollowUp,
} from "@/app/hooks/useFollowUps";
import { followUpErrorMessage } from "@/services/followup.client";
import { formatDate } from "@/components/follow-ups/status";
import type { SerializedTrackedEmail } from "@/types/followups/type";

interface Props {
  email: SerializedTrackedEmail;
  onClose: () => void;
}

/**
 * Editable follow-up composer. Generating a draft never sends anything:
 * the ONLY path to Gmail is the "Send Email" button below.
 */
export function FollowUpComposer({ email, onClose }: Props) {
  const draft = email.draft;
  const [to, setTo] = useState(draft?.to ?? email.recipientEmail);
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  // Seed passed to the editor; only changes when the server supplies new text.
  const [editorSeed, setEditorSeed] = useState(draft?.body ?? "");
  const [showOriginal, setShowOriginal] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(draft?.aiGenerated ?? false);
  const [error, setError] = useState<string | null>(null);

  const generate = useGenerateDraft();
  const save = useSaveDraft();
  const send = useSendFollowUp();
  const startedGeneration = useRef(false);

  const busy = generate.isPending || save.isPending || send.isPending;
  const editable = ["reminder_due", "draft_ready", "drafting"].includes(email.status);

  const applyDraft = (d: NonNullable<SerializedTrackedEmail["draft"]>) => {
    setTo(d.to);
    setSubject(d.subject);
    setBody(d.body);
    setEditorSeed(d.body);
    setAiGenerated(d.aiGenerated);
  };

  const runGenerate = () => {
    setError(null);
    generate.mutate(email.id, {
      onSuccess: (fresh) => {
        if (fresh.draft) applyDraft(fresh.draft);
        toast.success("Draft ready. Review it before sending.");
      },
      onError: (err) => {
        const msg = followUpErrorMessage(err, "Couldn't generate the draft.");
        setError(msg);
        toast.error(msg);
      },
    });
  };

  // User clicked "Draft Follow-up": generate once when no draft exists yet.
  useEffect(() => {
    if (!draft && email.status === "reminder_due" && !startedGeneration.current) {
      startedGeneration.current = true;
      runGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setError(null);
    save.mutate(
      { id: email.id, to, subject, body },
      {
        onSuccess: () => toast.success("Draft saved."),
        onError: (err) => {
          const msg = followUpErrorMessage(err, "Couldn't save the draft.");
          setError(msg);
          toast.error(msg);
        },
      },
    );
  };

  const handleSend = () => {
    if (busy) return; // guards repeated clicks
    setError(null);
    send.mutate(
      { id: email.id, to, subject, body },
      {
        onSuccess: () => {
          toast.success("Follow-up sent. It appears in the same Gmail conversation.");
          onClose();
        },
        onError: (err) => {
          const msg = followUpErrorMessage(err, "Couldn't send the email. Your draft is saved, try again.");
          setError(msg);
          toast.error(msg);
        },
      },
    );
  };

  const bodyEmpty = !body.replace(/<[^>]+>/g, "").trim();

  return (
    <Dialog.Root open onOpenChange={(o) => !o && !busy && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="dark fixed inset-x-0 bottom-0 z-[90] flex max-h-[94dvh] flex-col overflow-hidden rounded-t-2xl border border-[#27272a] bg-[#0f0f10] shadow-2xl focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(46rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
          onInteractOutside={(e) => busy && e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#27272a] px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <Dialog.Title className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                Follow-up email
                {aiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    <Sparkles className="h-3 w-3" /> AI-generated
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-zinc-500">
                Review and edit. Nothing is sent until you click Send Email.
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              aria-label="Close composer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#18181b] hover:text-white disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            {/* Related application */}
            {(email.company || email.position) && (
              <p className="flex items-center gap-2 text-xs text-zinc-400">
                <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                <span className="truncate">
                  {[email.position, email.company].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}

            {generate.isPending ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center" aria-busy="true">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                <p className="text-sm text-zinc-300">Writing your follow-up…</p>
                <p className="text-xs text-zinc-500">
                  Using your original email and application details.
                </p>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">To</span>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    disabled={!editable || busy}
                    inputMode="email"
                    className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#111111] px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/50 disabled:opacity-60"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Subject</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!editable || busy}
                    className="mt-1 h-10 w-full rounded-lg border border-[#27272a] bg-[#111111] px-3 text-sm text-zinc-100 outline-none focus:border-indigo-500/50 disabled:opacity-60"
                  />
                </label>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Message</span>
                  <div className="mt-1 overflow-hidden rounded-lg border border-[#27272a] bg-[#111111]">
                    <RichEmailEditor initialContent={editorSeed} onChange={setBody} />
                  </div>
                </div>

                {/* Original email reference */}
                <div className="rounded-lg border border-[#27272a] bg-[#0b0b0c]">
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    aria-expanded={showOriginal}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <span className="truncate">
                      Original email · {email.subject} · sent {formatDate(email.sentAt)}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showOriginal ? "rotate-180" : ""}`} />
                  </button>
                  {showOriginal && (
                    <div
                      className="max-h-48 overflow-y-auto border-t border-[#27272a] px-3 py-3 text-xs leading-relaxed text-zinc-400 [&_p]:mb-2"
                      // Stored HTML is the user's own sent message.
                      dangerouslySetInnerHTML={{ __html: email.originalBody }}
                    />
                  )}
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#27272a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={runGenerate}
                disabled={busy || !editable}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-300 hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? "animate-spin" : ""}`} />
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy || !editable || bodyEmpty || !subject.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-300 hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
              >
                {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex h-10 items-center rounded-lg px-3 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={busy || !editable || bodyEmpty || !subject.trim() || !to.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {send.isPending ? "Sending…" : "Send Email"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
