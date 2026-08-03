import clientPromise from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { parseEmailWithAI } from "@/services/parser.service";
import { ApplicationStatus } from "@/types/applications/type";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ─── Route Segment Config ─────────────────────────────────────────────────────
// Allow up to 30 MB body to accommodate 25 MB attachments + form field overhead.
export const maxDuration = 30;


// ─── MIME Builder ─────────────────────────────────────────────────────────────

const BOUNDARY_MIXED = "==JobPilot_mixed_boundary==";
const BOUNDARY_ALT = "==JobPilot_alt_boundary==";

/**
 * Converts an HTML string to a plain-text approximation by stripping tags
 * and normalising whitespace. Used as the text/plain fallback part.
 */
function htmlToPlainText(html: string): string {
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

interface AttachmentPart {
  filename: string;
  mimeType: string;
  data: Buffer;
}

/**
 * Builds a full RFC 2822 MIME email with:
 *   multipart/mixed
 *     └── multipart/alternative
 *           ├── text/plain
 *           └── text/html
 *     └── attachment #1 (optional)
 *     └── attachment #2 (optional)
 *     ...
 */
function buildMimeMessage(opts: {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  attachments: AttachmentPart[];
}): string {
  const { from, to, cc, bcc, subject, html, attachments } = opts;
  const plainText = htmlToPlainText(html);

  // Build headers
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${BOUNDARY_MIXED}"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  // multipart/alternative (plain + html)
  const altPart = [
    `--${BOUNDARY_ALT}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    plainText,
    "",
    `--${BOUNDARY_ALT}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">${html}</body></html>`,
    "",
    `--${BOUNDARY_ALT}--`,
  ].join("\r\n");

  // Attachment parts
  const attachmentParts = attachments
    .map((att) => {
      const b64 = att.data.toString("base64");
      // Wrap base64 at 76 chars per RFC 2045
      const wrapped = b64.match(/.{1,76}/g)?.join("\r\n") ?? b64;
      return [
        `--${BOUNDARY_MIXED}`,
        `Content-Type: ${att.mimeType}; name="${att.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${att.filename}"`,
        "",
        wrapped,
        "",
      ].join("\r\n");
    })
    .join("");

  // Assemble full message
  const body = [
    headers,
    "",
    `--${BOUNDARY_MIXED}`,
    `Content-Type: multipart/alternative; boundary="${BOUNDARY_ALT}"`,
    "",
    altPart,
    "",
    attachmentParts,
    `--${BOUNDARY_MIXED}--`,
  ].join("\r\n");

  return body;
}

/**
 * Encodes a raw MIME string as Base64URL (required by Gmail API).
 */
function toBase64Url(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? req.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { message: "User not authenticated", success: false },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // ── Lookup Google account ─────────────────────────────────────────────────
    const account = await db.collection("account").findOne({
      $or: [
        { userId: userId },
        {
          userId: (() => {
            try {
              return new ObjectId(userId);
            } catch {
              return null;
            }
          })(),
        },
      ],
      providerId: "google",
    });

    if (!account) {
      return NextResponse.json(
        {
          message:
            "No Google account linked. Please sign in with Google to enable Gmail sending.",
          success: false,
        },
        { status: 404 },
      );
    }

    // ── Parse multipart/form-data ─────────────────────────────────────────────
    const formData = await req.formData();

    const to = (formData.get("to") as string | null)?.trim() ?? "";
    const cc = (formData.get("cc") as string | null)?.trim() ?? "";
    const bcc = (formData.get("bcc") as string | null)?.trim() ?? "";
    const subject =
      (formData.get("subject") as string | null)?.trim() || "Job Application";
    const html =
      (formData.get("html") as string | null) ??
      "<p>Please find my application below.</p>";

    if (!to) {
      return NextResponse.json(
        { message: "Recipient email (to) is required.", success: false },
        { status: 400 },
      );
    }

    // ── Read attachment files ─────────────────────────────────────────────────
    const attachmentFiles = formData.getAll("attachments[]") as File[];
    const attachmentParts: AttachmentPart[] = await Promise.all(
      attachmentFiles
        .filter((f) => f instanceof File && f.size > 0)
        .map(async (f) => {
          const buf = Buffer.from(await f.arrayBuffer());
          return {
            filename: f.name,
            mimeType: f.type || "application/octet-stream",
            data: buf,
          };
        }),
    );

    // ── Build MIME message ────────────────────────────────────────────────────
    const senderEmail = session?.user?.email ?? "";

    const rawMime = buildMimeMessage({
      from: senderEmail,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html,
      attachments: attachmentParts,
    });

    const encodedMessage = toBase64Url(rawMime);

    // ── Set up Gmail client ───────────────────────────────────────────────────
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // ── Ensure "JobPilot" label exists ────────────────────────────────────────
    const labelsRes = await gmail.users.labels.list({ userId: "me" });
    let jobPilotLabel = labelsRes.data.labels?.find(
      (label) => label.name === "JobPilot",
    );

    if (!jobPilotLabel) {
      const newLabel = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: "JobPilot",
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      jobPilotLabel = newLabel.data;
    }

    // ── Send the email ────────────────────────────────────────────────────────
    const sentMessage = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    const gmailMessageId = sentMessage.data.id!;
    const threadId = sentMessage.data.threadId!;

    // ── Label the sent message ────────────────────────────────────────────────
    if (jobPilotLabel?.id) {
      await gmail.users.messages.modify({
        userId: "me",
        id: gmailMessageId,
        requestBody: { addLabelIds: [jobPilotLabel.id] },
      });
    }

    // ── Save Application record ───────────────────────────────────────────────
    try {
      await ConnectDB();

      const userObjectId = new mongoose.Types.ObjectId(userId);

      let company = "";
      let position = "";
      let location = "";
      let platform = "";
      let aiSummary = "";
      let notes = "";

      try {
        const parsed = await parseEmailWithAI({
          subject,
          from: senderEmail,
          body: html,
          snippet: html.replace(/<[^>]+>/g, "").slice(0, 200),
        });
        company = parsed.company || "";
        position = parsed.position || "";
        location = parsed.location || "";
        platform = parsed.platform || "";
        aiSummary = parsed.aiSummary || "";
        notes = parsed.notes || "";
      } catch {
        // AI parse failed — continue with empty fields
      }

      const attachmentMeta = attachmentParts.map((a) => ({
        name: a.filename,
        type: a.filename.split(".").pop()?.toLowerCase() || "file",
        size: `${(a.data.length / 1024).toFixed(0)} KB`,
      }));

      await ApplicationModel.updateOne(
        { userId: userObjectId, gmailMessageId },
        {
          $setOnInsert: {
            userId: userObjectId,
            gmailMessageId,
            threadId,
            company,
            companyLogo: "",
            position,
            recruiterEmail: to,
            candidateEmail: senderEmail,
            location,
            salary: "",
            platform,
            appliedVia: "Email",
            status: ApplicationStatus.APPLIED,
            subject,
            from: senderEmail,
            snippet: html.replace(/<[^>]+>/g, "").slice(0, 200),
            fullEmail: html,
            aiSummary,
            notes,
            labels: [],
            attachments: attachmentMeta,
            applicationDate: new Date(),
            receivedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (dbErr) {
      console.error("[send-email] Failed to save application record:", dbErr);
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
