import groq from "@/lib/ai/groq";
import type { GroqMessage, AIToolKey, UserAIContext } from "@/types/ai";
import { getToolSystemPrompt, buildTitleGeneratorPrompt } from "@/services/prompt.service";

// ─── Streaming Chat Completion ────────────────────────────────────────────────

/**
 * Creates a streaming Groq chat completion and returns a ReadableStream
 * that emits tokens as they arrive — exactly like ChatGPT.
 *
 * The stream emits raw text chunks. The caller is responsible for
 * collecting them and saving the final assembled content.
 */
export async function streamChatCompletion(params: {
  messages: GroqMessage[];
  tool?: AIToolKey;
  userContext?: UserAIContext;
  signal?: AbortSignal;
}): Promise<{
  stream: ReadableStream<Uint8Array>;
  getTokenCount: () => Promise<number>;
}> {
  const systemPrompt = getToolSystemPrompt(params.tool, params.userContext);

  const groqMessages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...params.messages,
  ];

  let tokenCount = 0;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages as Parameters<typeof groq.chat.completions.create>[0]["messages"],
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        });

        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            controller.enqueue(enc.encode(delta));
          }
          // Capture usage from the last chunk
          if (chunk.x_groq?.usage) {
            tokenCount = chunk.x_groq.usage.completion_tokens || 0;
          }
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return {
    stream,
    getTokenCount: async () => tokenCount,
  };
}

// ─── Title Generator ──────────────────────────────────────────────────────────

/**
 * Generates a short conversation title from the first user message.
 * Non-streaming, fast single-call.
 */
export async function generateConversationTitle(
  firstMessage: string,
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: buildTitleGeneratorPrompt(firstMessage),
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
      stream: false,
    });

    const title = completion.choices[0]?.message?.content?.trim() || "New Chat";
    // Limit to 80 chars just in case
    return title.slice(0, 80);
  } catch {
    // Fallback: use first 40 chars of the message
    return firstMessage.slice(0, 40).trim() + (firstMessage.length > 40 ? "…" : "");
  }
}

export interface AskAiOptions {
  fullName: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  hasResume?: boolean;
  hasPortfolio?: boolean;
}

export interface GeneratedEmail {
  subject: string;
  html: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAttachmentHint(
  hasResume: boolean,
  hasPortfolio: boolean,
): string {
  if (hasResume && hasPortfolio) {
    return "The candidate is attaching their resume and portfolio. Naturally mention: 'Please find my resume attached for your review. I have also attached my portfolio showcasing my recent work.'";
  }
  if (hasResume) {
    return "The candidate is attaching their resume. Naturally mention: 'Please find my resume attached for your review.'";
  }
  if (hasPortfolio) {
    return "The candidate is attaching their portfolio. Naturally mention: 'I have also attached my portfolio showcasing my recent work.'";
  }
  return "Do NOT mention any attachments, resume, or portfolio — none are being sent.";
}

// ─── AI Service ───────────────────────────────────────────────────────────────

/**
 * Generates a professional HTML job application email using Groq / LLaMA.
 *
 * Returns both a suggested subject line and the full email body as valid HTML
 * with semantic paragraph tags — so Gmail renders it with proper spacing.
 */
export async function askAi(
  jobDescription: string,
  userData?: AskAiOptions,
): Promise<GeneratedEmail> {
  const hasResume = userData?.hasResume ?? false;
  const hasPortfolio = userData?.hasPortfolio ?? false;
  const attachmentHint = buildAttachmentHint(hasResume, hasPortfolio);

  const systemPrompt = `
You are ApplyBuddy AI, an expert career assistant specializing in writing high-quality job application emails.
Your goal is to generate professional, personalized, and ATS-friendly application emails that maximize interview chances.

CRITICAL OUTPUT FORMAT:
- You MUST return a JSON object with exactly two fields: "subject" and "html".
- The "html" field MUST be a valid HTML string using only <p>, <br>, <strong>, <em>, <ul>, <li>, and <a> tags.
- Each paragraph MUST be wrapped in its own <p> tag. Never return plain text or a single block.
- The signature block must be formatted as:
  <p>Regards,<br><strong>[Candidate Name]</strong></p>
- Do NOT include <html>, <head>, or <body> wrapper tags.
- Do NOT use markdown, bullet dashes, or any non-HTML formatting.
- Do NOT add a subject line inside the html field.
- The subject must be concise and professional, e.g. "Application for Senior Frontend Developer – Yasin Memon".

EMAIL RULES:
- Write concise emails (150–250 words).
- Sound natural and human, never robotic.
- Match the tone of the job description.
- Highlight only the candidate's relevant skills and experience.
- Never invent achievements, skills, certifications, or experience not provided.
- Keep the email focused on value for the employer.
- Include a strong opening.
- Explain why the candidate is interested in the role.
- Connect the candidate's experience to the job requirements.
- End with a confident call-to-action.
- Maintain excellent grammar.
- Avoid buzzwords and unnecessary fluff.
- Don't use emojis.

ATTACHMENT INSTRUCTION:
${attachmentHint}

Candidate information:
- Name: ${userData?.fullName || "N/A"}
- Skills: ${userData?.skills?.join(", ") || "N/A"}
- Experience: ${userData?.experience?.join(", ") || "N/A"}
- Projects: ${userData?.projects?.join(", ") || "N/A"}

Always assume the candidate information above is the complete information available.
Never ask for additional information.
If some details (portfolio, LinkedIn, certifications, or resume) are missing, simply omit them.

EXAMPLE OUTPUT FORMAT:
{
  "subject": "Application for [Role] – [Candidate Name]",
  "html": "<p>Dear Hiring Manager,</p><p>I am excited to express my interest in the [Role] position...</p><p>Regards,<br><strong>[Candidate Name]</strong></p>"
}
`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `
Job Description:
${jobDescription}

Generate a professional HTML job application email following all the rules above.
Return ONLY valid JSON with "subject" and "html" fields. No markdown code fences, no extra text.
        `,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: GeneratedEmail;
  try {
    parsed = JSON.parse(raw) as GeneratedEmail;
  } catch {
    // Fallback: wrap plain text in a paragraph
    parsed = {
      subject: "Job Application",
      html: `<p>${raw.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
    };
  }

  // Ensure both fields exist
  if (!parsed.subject) parsed.subject = "Job Application";
  if (!parsed.html) parsed.html = "<p>Please find my application below.</p>";

  return parsed;
}
