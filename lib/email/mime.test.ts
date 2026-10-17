import { describe, expect, it } from "vitest";
import { simpleParser } from "mailparser";
import { buildSubject, composeRawEmail } from "./mime";

async function roundTrip(subject: string, filename = "resume.pdf") {
  const raw = await composeRawEmail({
    from: "me@example.com",
    to: "hr@example.com",
    subject,
    html: "<p>Héllo – body = “quoted” style=\"x\"</p>",
    attachments: [
      { filename, mimeType: "application/pdf", data: Buffer.from("%PDF-1.4 test") },
    ],
  });
  const text = Buffer.from(raw, "base64url").toString("utf8");
  return { text, parsed: await simpleParser(Buffer.from(raw, "base64url")) };
}

const subjects = [
  "Application for Developer - Yasin Memon",
  "Application for Business Analyst (BA Post Sales) & MySQL Developer – Yasin Memon",
  "Role — Name",
  "Café résumé é",
  "અરજી – યાસીન",
  "आवेदन – यासीन",
];

describe("composeRawEmail", () => {
  it.each(subjects)("round-trips subject: %s", async (subject) => {
    const { text, parsed } = await roundTrip(subject);
    expect(parsed.subject).toBe(subject);
    // Header must be pure ASCII on the wire
    const headerBlock = text.split("\r\n\r\n")[0];
    expect(/^[\x00-\x7f]*$/.test(headerBlock)).toBe(true);
    expect(text).toMatch(/MIME-Version: 1\.0/);
    expect(parsed.html).toContain("Héllo – body = “quoted”");
  });

  it("keeps the PDF attachment and an encoded non-ASCII filename", async () => {
    const { parsed } = await roundTrip("Hi", "résumé – યાસીન.pdf");
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0].filename).toBe("résumé – યાસીન.pdf");
    expect(parsed.attachments[0].content.toString()).toBe("%PDF-1.4 test");
  });
});

describe("buildSubject", () => {
  it("repairs mojibake", () => {
    expect(buildSubject("Developer Ã¢â‚¬â€œ Yasin Memon")).toBe("Developer – Yasin Memon");
    expect(buildSubject("Developer â€“ Yasin")).toBe("Developer – Yasin");
  });
  it("leaves legitimate text alone", () => {
    for (const s of subjects) expect(buildSubject(s)).toBe(s);
  });
  it("trims, collapses whitespace and strips line breaks", () => {
    expect(buildSubject("  A \r\nBcc: x@y.z  B ")).toBe("A Bcc: x@y.z B");
  });
  it("falls back when empty", () => {
    expect(buildSubject("   ")).toBe("Job Application");
  });
});
