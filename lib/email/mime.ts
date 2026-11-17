import MailComposer from "nodemailer/lib/mail-composer";

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface ComposeEmailOptions {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  /** RFC 5322 Message-ID of the message being replied to (threading). */
  inReplyTo?: string;
  references?: string;
}

const DEFAULT_SUBJECT = "Job Application";

// Windows-1252 bytes 0x80–0x9F, as characters (what a UTF-8 byte pair looks
// like when it is wrongly decoded as Latin-1/CP1252).
const CP1252_EXTRA: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86,
  "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95,
  "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

// A lead char (Ã, Â, â, à…) followed by a continuation-looking char.
const MOJIBAKE_RE = /[\u00c2-\u00f4][\u0080-\u00bf€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/;

function reverseMojibake(text: string): string | null {
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code <= 0xff) bytes.push(code);
    else if (CP1252_EXTRA[ch] !== undefined) bytes.push(CP1252_EXTRA[ch]);
    else return null; // genuine non-Latin text, not mojibake
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

/**
 * Normalises a subject line: repairs text that was already UTF-8 → CP1252
 * mis-decoded (possibly more than once), removes control characters / line
 * breaks (header injection) and collapses whitespace.
 */
export function buildSubject(input: string | null | undefined): string {
  let subject = (input ?? "").normalize("NFC");

  for (let i = 0; i < 3 && MOJIBAKE_RE.test(subject); i++) {
    const fixed = reverseMojibake(subject);
    if (!fixed || fixed === subject) break;
    subject = fixed;
  }

  subject = subject
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return subject || DEFAULT_SUBJECT;
}

/**
 * Builds the full RFC 5322 message with nodemailer's MailComposer, which
 * RFC 2047-encodes headers (once), RFC 2231-encodes non-ASCII attachment
 * filenames and applies proper transfer encodings. Returns Base64URL, as
 * required by the Gmail API `raw` field.
 */
export async function composeRawEmail(opts: ComposeEmailOptions): Promise<string> {
  const mail = new MailComposer({
    from: opts.from,
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    subject: buildSubject(opts.subject),
    inReplyTo: opts.inReplyTo,
    references: opts.references,
    text: htmlToPlainText(opts.html),
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">${opts.html}</body></html>`,
    textEncoding: "quoted-printable",
    attachments: (opts.attachments ?? []).map((a) => ({
      filename: a.filename,
      contentType: a.mimeType,
      content: a.data,
    })),
  });

  const message = await mail.compile().build();
  return message.toString("base64url");
}

/** Plain-text fallback part for the multipart/alternative body. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
