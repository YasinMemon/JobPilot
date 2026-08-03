import { IApplication, Application } from "@/types/applications/type";

/**
 * Formats a Date into a human-readable relative string.
 * e.g. "2 days ago", "Just now", "3 weeks ago"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

/**
 * Serializes an IApplication Mongoose document into the frontend Application type.
 * Converts ObjectIds to strings, Dates to ISO strings, and maps field name aliases.
 */
export function serializeApplication(doc: IApplication): Application {
  const d = doc as IApplication & {
    _id: { toString(): string };
    userId: { toString(): string };
  };

  return {
    id: d._id.toString(),
    userId: d.userId.toString(),

    gmailMessageId: d.gmailMessageId,
    threadId: d.threadId,

    // Company
    company: d.company,
    companyLogo: d.companyLogo || "",
    position: d.position,

    // Contact — `from` field becomes `email` on the frontend
    email: d.from,
    recruiterEmail: d.recruiterEmail || "",
    candidateEmail: d.candidateEmail || "",

    // Job details
    location: d.location || "",
    salary: d.salary || "",
    platform: d.platform || "",
    appliedVia: d.appliedVia || "",

    // Status
    status: d.status,

    // Email fields — `fullEmail` becomes `fullEmailContent` on the frontend
    subject: d.subject,
    snippet: d.snippet,
    fullEmailContent: d.fullEmail,

    // AI
    aiSummary: d.aiSummary || "",
    notes: d.notes || "",

    // Labels
    labels: d.labels || [],

    // Attachments — map to frontend shape
    attachments: (d.attachments || []).map((att) => {
      const ext = att.filename.split(".").pop()?.toLowerCase() || "file";
      const sizeStr = att.size
        ? att.size > 1024 * 1024
          ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(att.size / 1024)} KB`
        : "Unknown size";
      return {
        name: att.filename,
        size: sizeStr,
        type: ext,
        mimeType: att.mimeType,
      };
    }),

    // Dates
    date: formatRelativeDate(d.receivedAt),
    applicationDate: d.applicationDate ? d.applicationDate.toISOString() : undefined,
    receivedAt: d.receivedAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}
