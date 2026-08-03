"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportedResumeFile, RESUME_ACCEPTED_EXTENSIONS } from "@/lib/validations/auth";

type UploadResumeProps = {
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
};

export default function UploadResume({ value, onChange, error, helperText, disabled }: UploadResumeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInfo = useMemo(() => {
    if (!value) {
      return null;
    }

    return {
      name: value.name,
      size: `${Math.max(1, Math.round(value.size / 1024))} KB`,
    };
  }, [value]);

  const handleFile = (file?: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }

    if (!isSupportedResumeFile(file)) {
      onChange(null);
      return;
    }

    onChange(file);
  };

  const openPicker = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-slate-200">Resume Upload</label>
        <span className="text-xs text-slate-400">PDF or DOCX only</span>
      </div>

      <motion.div
        onClick={openPicker}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        data-disabled={disabled ? "true" : "false"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: disabled ? 1 : 0.995 }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-white/5 px-5 py-8 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10",
          isDragging && "border-indigo-400 bg-indigo-500/10",
          error ? "border-rose-400" : "border-white/10",
          disabled && "cursor-not-allowed opacity-70"
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500/20">
          <Upload className="size-6" />
        </div>

        <div className="mt-4 space-y-1 text-center">
          <p className="text-sm font-semibold text-white">Drag and drop your resume here</p>
          <p className="text-sm text-slate-400">
            Or click to upload a PDF or DOCX file up to 10 MB.
          </p>
        </div>

        {fileInfo ? (
          <div className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-200">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{fileInfo.name}</p>
                <p className="text-xs text-slate-400">{fileInfo.size}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Remove uploaded resume"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={[...RESUME_ACCEPTED_EXTENSIONS, "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].join(",")}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
      </motion.div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
        <p>{helperText ?? "Upload your current resume so JobPilot can tailor recommendations."}</p>
        {error ? <p className="font-medium text-rose-400">{error}</p> : null}
      </div>
    </div>
  );
}