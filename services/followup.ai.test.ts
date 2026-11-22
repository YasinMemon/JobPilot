import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/ai/groq", () => ({
  default: { chat: { completions: { create } } },
}));

import {
  buildFollowUpUserPrompt,
  generateFollowUpDraft,
  parseFollowUpResponse,
  type FollowUpDraftContext,
} from "./followup.ai";

const ctx: FollowUpDraftContext = {
  candidateName: "Yasin Memon",
  recipientName: "Priya",
  recipientEmail: "priya@abc.com",
  company: "ABC Technologies",
  position: "Frontend Developer",
  originalSubject: "Application for Frontend Developer",
  originalBody: "I am excited to apply for the role.",
  originalSentAt: new Date("2026-03-01T00:00:00Z"),
  now: new Date("2026-03-11T00:00:00Z"),
  previousFollowUps: [],
};

beforeEach(() => vi.clearAllMocks());

describe("follow-up prompt", () => {
  it("includes the real application and email context", () => {
    const p = buildFollowUpUserPrompt(ctx);
    expect(p).toContain("ABC Technologies");
    expect(p).toContain("Frontend Developer");
    expect(p).toContain("Application for Frontend Developer");
    expect(p).toContain("I am excited to apply for the role.");
    expect(p).toContain("10 days ago");
    expect(p).toContain("Previous follow-ups:\nNone");
  });

  it("includes earlier follow-ups as history", () => {
    const p = buildFollowUpUserPrompt({
      ...ctx,
      previousFollowUps: [{ sentAt: new Date("2026-03-11T00:00:00Z"), body: "Just checking in." }],
    });
    expect(p).toContain("Follow-up #1");
    expect(p).toContain("Just checking in.");
  });
});

describe("parseFollowUpResponse", () => {
  it("parses a valid JSON draft", () => {
    const r = parseFollowUpResponse(
      JSON.stringify({ subject: "Re: Hello", html: "<p>Hi</p>" }),
      "Hello",
    );
    expect(r).toEqual({ subject: "Re: Hello", html: "<p>Hi</p>" });
  });

  it("strips disallowed tags and scripts", () => {
    const r = parseFollowUpResponse(
      JSON.stringify({ subject: "S", html: '<p>Hi</p><script>alert(1)</script><img src=x onerror=1><a href="x">l</a>' }),
      "S",
    );
    expect(r.html).toBe("<p>Hi</p>l");
  });

  it("falls back to a Re: subject and wraps plain-text output", () => {
    const r = parseFollowUpResponse("Hello there\n\nSecond paragraph", "Original");
    expect(r.subject).toBe("Re: Original");
    expect(r.html).toBe("<p>Hello there</p><p>Second paragraph</p>");
  });

  it("rejects an empty body", () => {
    expect(() => parseFollowUpResponse(JSON.stringify({ subject: "S", html: "<p> </p>" }), "S")).toThrow();
  });
});

describe("generateFollowUpDraft", () => {
  it("returns a draft from the model and never touches email sending", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ subject: "Re: X", html: "<p>Body</p>" }) } }],
    });
    const r = await generateFollowUpDraft(ctx);
    expect(r).toEqual({ subject: "Re: X", html: "<p>Body</p>" });
    expect(create).toHaveBeenCalledOnce();
    const args = create.mock.calls[0][0];
    expect(args.messages[0].content).toMatch(/Never invent/i);
  });
});
