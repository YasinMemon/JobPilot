import { ResumeError } from "@/lib/resume/errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Kind = "pdf" | "docx" | "txt";

function detectKind(file: File): Kind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx") || file.type === DOCX_MIME) return "docx";
  if (name.endsWith(".txt") || file.type === "text/plain") return "txt";
  return null;
}

/**
 * Extracts plain text from an uploaded job description (.pdf, .docx, .txt).
 * The file is parsed in memory and never stored.
 */
export async function extractJobDescriptionText(file: File): Promise<string> {
  const kind = detectKind(file);
  if (!kind) {
    throw new ResumeError(
      "INVALID_FILE",
      "Unsupported file type. Please upload a .pdf, .docx or .txt file.",
    );
  }
  if (file.size === 0) {
    throw new ResumeError("INVALID_FILE", "That file is empty.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ResumeError("INVALID_FILE", "File is too large. The limit is 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  try {
    if (kind === "txt") {
      text = buffer.toString("utf-8");
    } else if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
  } catch (err) {
    console.error(
      "[resume] JD file parse failed:",
      err instanceof Error ? err.message : err,
    );
    throw new ResumeError(
      "INVALID_FILE",
      "We couldn't read that file. Try a different file or paste the text instead.",
    );
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) {
    throw new ResumeError(
      "INVALID_FILE",
      "No readable text was found in that file. Scanned documents aren't supported - paste the text instead.",
    );
  }
  return text;
}
