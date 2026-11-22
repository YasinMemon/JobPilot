import type { gmail_v1 } from "googleapis";
import { withGmailRetry } from "@/lib/gmail/userClient";

/**
 * Recipient-reply detection from Gmail thread metadata.
 *
 * A message counts as a genuine reply only when ALL of these hold:
 *  - it is in the tracked thread and is not the tracked message itself;
 *  - it was not sent by the user (no SENT/DRAFT label, From is not the sender);
 *  - it arrived after the tracked email was sent;
 *  - its From address is one of the original recipients (to/cc/bcc);
 *  - it is not an automatic message (auto-reply, out-of-office, bounce).
 *
 * Subject matching is deliberately NOT used.
 */

export interface ReplyCheckTarget {
  gmailMessageId: string;
  gmailThreadId: string;
  sentAt: Date;
  monitoredAddresses: string[];
  senderEmail?: string;
}

export interface ReplyCheckResult {
  replied: boolean;
  replyAt?: Date;
  replyMessageId?: string;
  /** false when the thread no longer exists (deleted) */
  threadFound: boolean;
}

export function extractEmailAddress(header: string | null | undefined): string {
  if (!header) return "";
  const angle = header.match(/<([^<>\s]+@[^<>\s]+)>/);
  const raw = angle ? angle[1] : header.trim();
  const bare = raw.match(/[^\s"'<>,;()]+@[^\s"'<>,;()]+/);
  return (bare ? bare[0] : "").toLowerCase();
}

/** Split "A <a@x.com>, b@y.com" into lower-cased addresses. */
export function extractEmailAddresses(header: string | null | undefined): string[] {
  if (!header) return [];
  const found = header.match(/[A-Z0-9._%+'-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return Array.from(new Set(found.map((a) => a.toLowerCase())));
}

function header(msg: gmail_v1.Schema$Message, name: string): string {
  const h = msg.payload?.headers?.find(
    (x) => x.name?.toLowerCase() === name.toLowerCase(),
  );
  return h?.value ?? "";
}

function isAutomatic(msg: gmail_v1.Schema$Message): boolean {
  const autoSubmitted = header(msg, "Auto-Submitted").toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;
  if (/auto[_-]?reply|auto_reply|bulk|junk/i.test(header(msg, "Precedence"))) return true;
  if (header(msg, "X-Autoreply") || header(msg, "X-Autorespond")) return true;
  if (/^(mailer-daemon|postmaster)@/i.test(extractEmailAddress(header(msg, "From")))) {
    return true;
  }
  return false;
}

/** Pure decision function (unit-tested): inspects already-fetched messages. */
export function detectRecipientReply(
  messages: gmail_v1.Schema$Message[],
  target: ReplyCheckTarget,
): ReplyCheckResult {
  const monitored = new Set(target.monitoredAddresses.map((a) => a.toLowerCase()));
  const sender = target.senderEmail?.toLowerCase() ?? "";
  const sentMs = target.sentAt.getTime();

  let earliest: { at: Date; id: string } | null = null;

  for (const msg of messages) {
    if (!msg.id || msg.id === target.gmailMessageId) continue;

    const labels = msg.labelIds ?? [];
    if (labels.includes("SENT") || labels.includes("DRAFT")) continue;

    const at = new Date(Number(msg.internalDate ?? 0));
    if (!Number.isFinite(at.getTime()) || at.getTime() <= sentMs) continue;

    const from = extractEmailAddress(header(msg, "From"));
    if (!from || from === sender || !monitored.has(from)) continue;
    if (isAutomatic(msg)) continue;

    if (!earliest || at < earliest.at) earliest = { at, id: msg.id };
  }

  return earliest
    ? { replied: true, replyAt: earliest.at, replyMessageId: earliest.id, threadFound: true }
    : { replied: false, threadFound: true };
}

const METADATA_HEADERS = [
  "From",
  "To",
  "Cc",
  "Reply-To",
  "Subject",
  "Message-ID",
  "Auto-Submitted",
  "Precedence",
  "X-Autoreply",
  "X-Autorespond",
];

/** Fetches the tracked thread (metadata only) and decides whether it was answered. */
export async function checkThreadForReply(
  gmail: gmail_v1.Gmail,
  target: ReplyCheckTarget,
): Promise<ReplyCheckResult> {
  let thread: gmail_v1.Schema$Thread;
  try {
    const res = await withGmailRetry(() =>
      gmail.users.threads.get({
        userId: "me",
        id: target.gmailThreadId,
        format: "metadata",
        metadataHeaders: METADATA_HEADERS,
      }),
    );
    thread = res.data;
  } catch (err) {
    const status = (err as { code?: number; response?: { status?: number } })?.response?.status
      ?? (err as { code?: number })?.code;
    if (status === 404) return { replied: false, threadFound: false };
    throw err;
  }

  return detectRecipientReply(thread.messages ?? [], target);
}
