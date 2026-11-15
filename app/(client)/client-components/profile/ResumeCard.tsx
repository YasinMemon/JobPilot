"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  FileText,
  X,
  ExternalLink,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import InfoCard from "../ui/InfoCard";
import { User } from "@/types/user";
import axios from "axios";

/**
 * Build a Cloudinary URL that forces the browser to download the file
 * by injecting the fl_attachment flag into the URL path.
 *
 * Cloudinary raw URL format:
 *   https://res.cloudinary.com/{cloud}/raw/upload/{public_id}
 * With download flag:
 *   https://res.cloudinary.com/{cloud}/raw/upload/fl_attachment/{public_id}
 */
function buildDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  // Inject fl_attachment after /upload/
  return url.replace("/upload/", "/upload/fl_attachment/");
}

/**
 * Google Docs PDF viewer URL — lets the browser preview any public PDF
 * without CORS issues since it proxies through Google.
 */
function buildPreviewUrl(url: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

export default function ResumeCard({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumeUrl = user?.resume || "";
  const isUrl =
    resumeUrl.startsWith("http://") || resumeUrl.startsWith("https://");

  const resumeFileName = resumeUrl
    ? decodeURIComponent(resumeUrl.split("/").pop()?.split("?")[0] || "Resume")
    : "No resume uploaded";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<{
        success: boolean;
        data: { url: string };
        message: string;
      }>("/api/upload/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setProfile((prev) => ({
          ...prev!,
          resume: response.data.data.url,
        }));
        setUploadSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!resumeUrl) return;
    const downloadUrl = buildDownloadUrl(resumeUrl);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = resumeFileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <InfoCard title="Resume">
        <div className="flex flex-col justify-between gap-4 rounded-xl border p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {/* File icon — view mode only */}
            {!isEditing && (
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            )}

            {isEditing ? (
              <div className="flex flex-col gap-3 w-full">
                {/* Current resume info */}
                {resumeUrl && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate text-muted-foreground max-w-xs">
                      {resumeFileName}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 ml-auto" />
                  </div>
                )}

                {/* Upload button */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-fit gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {resumeUrl
                          ? "Replace Resume (PDF)"
                          : "Upload Resume (PDF)"}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PDF only · Max 10 MB
                  </p>
                </div>

                {/* Feedback */}
                {uploadSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Resume uploaded successfully!
                  </p>
                )}
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-semibold">
                  {resumeUrl ? resumeFileName : "No resume uploaded"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resumeUrl
                    ? "PDF · Click View to preview or Download to save"
                    : "Please upload your resume in edit mode"}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons — view mode only */}
          {!isEditing && resumeUrl && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </div>
      </InfoCard>

      {/* Resume Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div className="relative flex h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl sm:w-[92vw] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 border-b px-3 py-3 shrink-0 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold truncate max-w-[160px] text-sm sm:max-w-[300px] md:text-base">
                    {resumeFileName}
                  </h2>
                  <p className="text-xs text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="hidden sm:flex"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resumeUrl, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body — PDF Preview via Google Docs Viewer */}
            <div className="flex-1 overflow-hidden bg-muted/20">
              {isUrl ? (
                <iframe
                  src={buildPreviewUrl(resumeUrl)}
                  className="h-full w-full border-0"
                  title="Resume PDF Preview"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium">Cannot preview this file</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please re-upload your resume in edit mode.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
