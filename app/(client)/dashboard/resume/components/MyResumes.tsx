"use client";

import { useState } from "react";
import { Copy, Download, FileText, Pencil, Trash2 } from "lucide-react";
import { RESUME_TEMPLATES, type SavedResumeSummary } from "@/types/resume";
import { Btn, Card, IconBtn, Menu, MenuItem, Modal, TextInput } from "./ui";

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  resumes: SavedResumeSummary[] | null;
  error: string | null;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (id: string, format: "pdf" | "docx", name: string) => Promise<void>;
  onRetry: () => void;
  onCreate: () => void;
}

export default function MyResumes({
  resumes,
  error,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  onDownload,
  onRetry,
  onCreate,
}: Props) {
  const [renaming, setRenaming] = useState<SavedResumeSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<SavedResumeSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-[13px] text-zinc-400">{error}</p>
        <Btn onClick={onRetry}>Try again</Btn>
      </Card>
    );
  }

  if (resumes === null) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border border-[#27272a] bg-[#111111]" />
        ))}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-purple-600/20">
          <FileText className="h-5 w-5 text-blue-400" />
        </div>
        <p className="text-[14px] font-semibold text-white">No saved resumes yet</p>
        <p className="max-w-sm text-[13px] text-zinc-500">
          Generate a resume tailored to a job description and save it — every version is kept here.
        </p>
        <Btn variant="primary" onClick={onCreate}>Create a tailored resume</Btn>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resumes.map((r) => {
          const title = [r.targetJobTitle, r.targetCompany].filter(Boolean).join(" — ") || r.name;
          const template = RESUME_TEMPLATES.find((t) => t.key === r.template)?.name;
          const busy = busyId === r._id;
          return (
            <Card key={r._id} className="flex flex-col gap-4 transition-colors hover:border-[#3f3f46]">
              <button type="button" onClick={() => onOpen(r._id)} className="space-y-1 text-left">
                <p className="line-clamp-2 text-[14px] font-semibold text-white">{title}</p>
                {title !== r.name && <p className="truncate text-[12px] text-zinc-500">{r.name}</p>}
                <p className="text-[12px] text-zinc-600">
                  Created: {formatDate(r.createdAt)} · {template}
                </p>
              </button>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[12px] font-semibold text-blue-300">
                  {r.matchScore}% match
                </span>
                <div className="flex items-center">
                  <IconBtn label="Edit" disabled={busy} onClick={() => onOpen(r._id)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn label="Duplicate" disabled={busy} onClick={() => run(r._id, () => onDuplicate(r._id))}><Copy className="h-3.5 w-3.5" /></IconBtn>
                  <Menu
                    trigger={({ toggle }) => (
                      <IconBtn label="Download" disabled={busy} onClick={toggle}><Download className="h-3.5 w-3.5" /></IconBtn>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem onClick={() => { close(); run(r._id, () => onDownload(r._id, "pdf", r.name)); }}>Download PDF</MenuItem>
                        <MenuItem onClick={() => { close(); run(r._id, () => onDownload(r._id, "docx", r.name)); }}>Download DOCX</MenuItem>
                      </>
                    )}
                  </Menu>
                  <IconBtn label="Rename" disabled={busy} onClick={() => { setRenaming(r); setRenameValue(r.name); }}><FileText className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn label="Delete" disabled={busy} onClick={() => setDeleting(r)} className="hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {renaming && (
        <Modal title="Rename resume" onClose={() => setRenaming(null)}>
          <TextInput value={renameValue} maxLength={140} autoFocus onChange={(e) => setRenameValue(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <Btn
              variant="primary"
              className="flex-1"
              disabled={!renameValue.trim()}
              onClick={() => {
                const target = renaming;
                setRenaming(null);
                void run(target._id, () => onRename(target._id, renameValue.trim()));
              }}
            >
              Save
            </Btn>
            <Btn className="flex-1" onClick={() => setRenaming(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete resume" onClose={() => setDeleting(null)}>
          <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
            Delete <span className="font-medium text-white">{deleting.name}</span>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Btn
              variant="danger"
              className="flex-1"
              onClick={() => {
                const target = deleting;
                setDeleting(null);
                void run(target._id, () => onDelete(target._id));
              }}
            >
              Delete
            </Btn>
            <Btn className="flex-1" onClick={() => setDeleting(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
