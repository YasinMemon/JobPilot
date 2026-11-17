import groq from "@/lib/ai/groq";

/**
 * AI follow-up draft generation. Generation ONLY produces text — it never
 * sends anything. Sending requires a separate, explicit user action.
 */

export interface FollowUpDraftContext {
  candidateName: string;
  recipientName: string;
  recipientEmail: string;
  company: string;
  position: string;
  originalSubject: string;
  /** Plain text of the original email. */
  originalBody: string;
  originalSentAt: Date;
  now: Date;
  /** Previous follow-ups already sent (plain text), oldest first. */
  previousFollowUps: { sentAt: Date; body: string }[];
}

export interface GeneratedFollowUp {
  subject: string;
  /** HTML using only <p>, <br>, <strong>, <em>. */
  html: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SYSTEM_PROMPT = `You write short, polite follow-up emails for job seekers.

OUTPUT: return ONLY a JSON object with exactly two string fields, "subject" and "html".
- "html" uses only <p>, <br>, <strong>, <em> tags; every paragraph in its own <p>. No <html>/<body>, no markdown.
- Do not put the subject inside "html".

RULES:
- Professional, warm and concise (80-140 words).
- Politely refer to the previous email (and its date) and the role.
- Express continued interest and ask kindly for an update on the application.
- Never sound demanding, entitled, desperate or passive-aggressive.
- Use ONLY facts present in the context. Never invent skills, achievements, interviews, dates, names or promises.
- If the recipient name is unknown, greet with "Dear Hiring Team,".
- Keep the same language as the original email.
- Subject: start with "Re: " followed by the original subject, unless the original already starts with "Re:".
- Close with "Best regards," then the candidate's name. No emojis.`;

export function buildFollowUpUserPrompt(ctx: FollowUpDraftContext): string {
  const days = Math.max(
    1,
    Math.floor((ctx.now.getTime() - ctx.originalSentAt.getTime()) / 86_400_000),
  );
  const history = ctx.previousFollowUps.length
    ? ctx.previousFollowUps
        .map(
          (f, i) =>
            `Follow-up #${i + 1} (sent ${f.sentAt.toISOString().slice(0, 10)}):\n${f.body.slice(0, 1200)}`,
        )
        .join("\n\n")
    : "None";

  return `Context
- Candidate name: ${ctx.candidateName || "Unknown"}
- Recipient name: ${ctx.recipientName || "Unknown"}
- Recipient email: ${ctx.recipientEmail}
- Company: ${ctx.company || "Unknown"}
- Position: ${ctx.position || "Unknown"}
- Original email sent: ${ctx.originalSentAt.toISOString().slice(0, 10)} (${days} days ago)
- Original subject: ${ctx.originalSubject}

Original email body:
"""
${ctx.originalBody.slice(0, 4000)}
"""

Previous follow-ups:
${history}

Write the follow-up email now.`;
}

function toHtmlParagraphs(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Parses the model output defensively. Exported for tests. */
export function parseFollowUpResponse(
  raw: string,
  fallbackSubject: string,
): GeneratedFollowUp {
  let subject = "";
  let html = "";
  try {
    const parsed = JSON.parse(raw) as { subject?: unknown; html?: unknown };
    subject = typeof parsed.subject === "string" ? parsed.subject : "";
    html = typeof parsed.html === "string" ? parsed.html : "";
  } catch {
    html = raw.trim() ? toHtmlParagraphs(raw.trim()) : "";
  }

  // Remove anything outside the small allowed tag set.
  html = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<(?!\/?(p|br|strong|em)\b)[^>]*>/gi, "");

  if (!stripHtml(html)) {
    throw new Error("AI returned an empty follow-up email.");
  }

  subject = subject.replace(/\s+/g, " ").trim();
  if (!subject) {
    subject = /^re:/i.test(fallbackSubject)
      ? fallbackSubject
      : `Re: ${fallbackSubject}`;
  }
  return { subject: subject.slice(0, 300), html };
}

export async function generateFollowUpDraft(
  ctx: FollowUpDraftContext,
): Promise<GeneratedFollowUp> {
  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildFollowUpUserPrompt(ctx) },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  return parseFollowUpResponse(raw, ctx.originalSubject);
}
