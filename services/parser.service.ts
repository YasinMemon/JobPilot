import groq from "@/lib/ai/groq";
import { ApplicationStatus } from "@/types/applications/type";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailParseInput {
  subject: string;
  from: string;
  body: string;
  snippet: string;
}

export interface ParsedEmailData {
  company: string;
  position: string;
  recruiterEmail: string;
  candidateEmail: string;
  location: string;
  salary: string;
  status: ApplicationStatus;
  platform: string;
  applicationDate: string | null;
  notes: string;
  aiSummary: string;
  companyLogo: string;
}

// ─── Safe Defaults ────────────────────────────────────────────────────────────

const DEFAULT_PARSE: ParsedEmailData = {
  company: "",
  position: "",
  recruiterEmail: "",
  candidateEmail: "",
  location: "",
  salary: "",
  status: ApplicationStatus.UNKNOWN,
  platform: "",
  applicationDate: null,
  notes: "",
  aiSummary: "",
  companyLogo: "",
};

// ─── AI Email Parser ──────────────────────────────────────────────────────────

/**
 * Uses Groq AI to extract structured job application data from an email.
 *
 * Returns safe defaults for any field it cannot reliably extract.
 * Never throws — always returns a valid ParsedEmailData object.
 */
export async function parseEmailWithAI(
  email: EmailParseInput,
): Promise<ParsedEmailData> {
  const systemPrompt = `You are a job application email parser. Extract structured data from job application emails.

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{
  "company": "Company name (string, empty string if unknown)",
  "position": "Job title / role (string, empty string if unknown)",
  "recruiterEmail": "Recruiter or sender email address (string, empty string if not found)",
  "candidateEmail": "Candidate's email if mentioned (string, empty string if not found)",
  "location": "Job location or 'Remote' (string, empty string if not specified)",
  "salary": "Salary range or compensation if mentioned (string, empty string if not mentioned)",
  "status": "One of: Applied, Viewed, Interview, Assessment, Shortlisted, Offer, Rejected, Hired, Unknown",
  "platform": "Platform where job was found e.g. LinkedIn, Indeed, Glassdoor (string, empty if not mentioned)",
  "applicationDate": "ISO 8601 date string if mentioned, null if not found",
  "notes": "1-2 sentence summary of any important action items or next steps (string)",
  "aiSummary": "2-3 sentence professional summary of this email for the candidate (string)",
  "companyLogo": "Empty string (we do not guess URLs)"
}

Status mapping guide:
- "Applied" / "received your application" / "thank you for applying" → Applied
- "viewed your profile" / "looked at your application" → Viewed
- "interview" / "schedule a call" / "meet with" → Interview
- "assessment" / "test" / "coding challenge" / "assignment" → Assessment
- "shortlisted" / "selected for next round" → Shortlisted
- "offer" / "pleased to offer" / "compensation" → Offer
- "rejected" / "not moving forward" / "other candidates" / "unfortunately" → Rejected
- "hired" / "welcome aboard" / "start date" / "onboarding" → Hired
- Anything else → Unknown`;

  const userPrompt = `Parse this job application email:

Subject: ${email.subject}
From: ${email.from}
Snippet: ${email.snippet}

Email body (first 3000 chars):
${email.body.slice(0, 3000)}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "qwen/qwen3.8-27b",
      temperature: 0.1, // Low temperature for consistent structured output
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return { ...DEFAULT_PARSE };

    // Strip markdown code blocks if present
    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as Partial<ParsedEmailData>;

    // Validate and normalise status
    const validStatuses = Object.values(ApplicationStatus) as string[];
    const status = validStatuses.includes(parsed.status as string)
      ? (parsed.status as ApplicationStatus)
      : ApplicationStatus.UNKNOWN;

    return {
      company: parsed.company || "",
      position: parsed.position || "",
      recruiterEmail: parsed.recruiterEmail || "",
      candidateEmail: parsed.candidateEmail || "",
      location: parsed.location || "",
      salary: parsed.salary || "",
      status,
      platform: parsed.platform || "",
      applicationDate: parsed.applicationDate || null,
      notes: parsed.notes || "",
      aiSummary: parsed.aiSummary || "",
      companyLogo: "",
    };
  } catch (error) {
    // Silently return defaults — never crash the sync pipeline
    console.error("[parser.service] AI parse failed:", error);
    return { ...DEFAULT_PARSE };
  }
}
