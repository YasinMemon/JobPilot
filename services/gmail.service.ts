import { gmail_v1 } from "googleapis";
import clientPromise from "@/lib/mongodb";
import { createGmailClient } from "@/lib/gmailClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedGmailMessage {
  gmailMessageId: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  receivedAt: Date;
  attachments: {
    filename: string;
    mimeType: string;
    size?: number;
  }[];
}

// ─── Access Token ─────────────────────────────────────────────────────────────

/**
 * Retrieves the stored Google OAuth2 access token for a given account.
 * Better Auth stores tokens in the `account` collection in MongoDB.
 *
 * @param recordId - The Better Auth internal account record ID (the `id` field in the `account` collection)
 * @returns The access token string
 */
export async function getAccessToken(recordId: string): Promise<string> {
  const client = await clientPromise;
  const db = client.db();

  const account = await db.collection("account").findOne({ id: recordId });

  if (!account) {
    throw new Error(`No account found for recordId: ${recordId}`);
  }

  if (!account.accessToken) {
    throw new Error(
      "No access token stored. User must re-authenticate with Google.",
    );
  }

  return account.accessToken as string;
}

// ─── Email Body Decoder ───────────────────────────────────────────────────────

/**
 * Recursively extracts and decodes the plain-text or HTML body from
 * a Gmail message payload.
 */
function decodeEmailBody(payload: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  // Direct body data (text/plain preferred over text/html)
  if (payload.body?.data) {
    const buff = Buffer.from(payload.body.data, "base64");
    return buff.toString("utf-8");
  }

  // Multipart — recurse to find text/plain first, then text/html
  if (payload.parts && payload.parts.length > 0) {
    // Prefer text/plain
    const plainPart = payload.parts.find(
      (p) => p.mimeType === "text/plain",
    );
    if (plainPart) return decodeEmailBody(plainPart);

    // Fall back to text/html
    const htmlPart = payload.parts.find(
      (p) => p.mimeType === "text/html",
    );
    if (htmlPart) return decodeEmailBody(htmlPart);

    // Recurse into nested multipart
    for (const part of payload.parts) {
      const result = decodeEmailBody(part);
      if (result) return result;
    }
  }

  return "";
}

/**
 * Extracts attachment metadata from a Gmail message payload.
 */
function extractAttachments(
  payload: gmail_v1.Schema$MessagePart,
): { filename: string; mimeType: string; size?: number }[] {
  const attachments: { filename: string; mimeType: string; size?: number }[] =
    [];

  function recurse(part: gmail_v1.Schema$MessagePart) {
    if (
      part.filename &&
      part.filename.length > 0 &&
      part.body?.attachmentId
    ) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || undefined,
      });
    }
    if (part.parts) {
      part.parts.forEach(recurse);
    }
  }

  recurse(payload);
  return attachments;
}

// ─── Fetch Job Emails ─────────────────────────────────────────────────────────

/**
 * Fetches job-related emails from Gmail.
 *
 * Strategy:
 * 1. First tries the "JobPilot" label (if user has created it)
 * 2. Falls back to searching for common job application keywords
 *
 * @param accessToken - Google OAuth2 access token
 * @param maxResults  - Max number of messages to fetch (default: 50)
 * @returns Array of parsed Gmail messages ready for AI processing
 */
export async function fetchJobEmails(
  accessToken: string,
  maxResults: number = 50,
): Promise<ParsedGmailMessage[]> {
  const gmail = createGmailClient(accessToken);

  // Job-related search query — broad enough to catch most application emails
  const jobSearchQuery = [
    "subject:(application OR applied OR interview OR offer OR assessment OR shortlisted OR hired OR rejected OR opportunity OR position OR role OR job)",
    "newer_than:30d",
  ].join(" ");

  let messageIds: string[] = [];

  // 1. Try "JobPilot" label first
  try {
    const labelRes = await gmail.users.labels.list({ userId: "me" });
    const jobPilotLabel = labelRes.data.labels?.find(
      (l) => l.name?.toLowerCase() === "jobpilot",
    );

    if (jobPilotLabel?.id) {
      const labelMsgs = await gmail.users.messages.list({
        userId: "me",
        labelIds: [jobPilotLabel.id],
        maxResults,
        // Newest first (default Gmail ordering)
      });
      messageIds = (labelMsgs.data.messages || [])
        .map((m) => m.id!)
        .filter(Boolean);
    }
  } catch {
    // Label not found or API error — fall through to keyword search
  }

  // 2. Fall back to keyword search if no label messages found
  if (messageIds.length === 0) {
    const searchRes = await gmail.users.messages.list({
      userId: "me",
      q: jobSearchQuery,
      maxResults,
    });
    messageIds = (searchRes.data.messages || [])
      .map((m) => m.id!)
      .filter(Boolean);
  }

  if (messageIds.length === 0) {
    return [];
  }

  // 3. Fetch full message details in parallel (batched to avoid rate limits)
  const BATCH_SIZE = 10;
  const parsed: ParsedGmailMessage[] = [];

  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((id) =>
        gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        }),
      ),
    );

    for (const result of results) {
      if (result.status === "rejected") continue;

      const msg = result.value.data;
      if (!msg.id || !msg.threadId || !msg.payload) continue;

      const headers = msg.payload.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value || "";

      const subject = getHeader("Subject");
      const from = getHeader("From");
      const dateStr = getHeader("Date");
      const receivedAt = dateStr ? new Date(dateStr) : new Date();

      const body = decodeEmailBody(msg.payload);
      const attachments = extractAttachments(msg.payload);

      parsed.push({
        gmailMessageId: msg.id,
        threadId: msg.threadId,
        subject,
        from,
        snippet: msg.snippet || "",
        body,
        receivedAt,
        attachments,
      });
    }
  }

  return parsed;
}
