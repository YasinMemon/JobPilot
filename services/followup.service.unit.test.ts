import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mongodb", () => ({ default: Promise.resolve({}) }));
vi.mock("@/lib/db", () => ({ default: async () => undefined }));
vi.mock("@/lib/ai/groq", () => ({ default: { chat: { completions: { create: vi.fn() } } } }));

import {
  DAY_MS,
  FollowUpError,
  computeFirstFollowUpAt,
  parseRecipients,
  reminderDedupeKey,
  sendApprovedFollowUp,
} from "./followup.service";
import { buildReminderCopy } from "./followup.scheduler";

describe("10-day follow-up calculation", () => {
  it("uses the actual sent timestamp + 10 days", () => {
    const sentAt = new Date("2026-03-01T15:30:00Z");
    expect(computeFirstFollowUpAt(sentAt).toISOString()).toBe("2026-03-11T15:30:00.000Z");
    expect(computeFirstFollowUpAt(sentAt).getTime() - sentAt.getTime()).toBe(10 * DAY_MS);
  });
});

describe("recipient parsing", () => {
  it("extracts the primary recipient, name and every monitored address", () => {
    const r = parseRecipients('"Priya Shah" <Priya@ABC.com>, boss@abc.com', "cc@abc.com", "bcc@x.com");
    expect(r.email).toBe("priya@abc.com");
    expect(r.name).toBe("Priya Shah");
    expect(r.monitored).toEqual(["priya@abc.com", "boss@abc.com", "cc@abc.com", "bcc@x.com"]);
  });

  it("handles a bare address without a name", () => {
    const r = parseRecipients("hr@abc.com");
    expect(r).toEqual({ email: "hr@abc.com", name: "", monitored: ["hr@abc.com"] });
  });
});

describe("reminder dedupe", () => {
  it("is stable per record+cycle and changes after a snooze", () => {
    expect(reminderDedupeKey("abc", 0)).toBe(reminderDedupeKey("abc", 0));
    expect(reminderDedupeKey("abc", 0)).not.toBe(reminderDedupeKey("abc", 1));
    expect(reminderDedupeKey("abc", 0)).not.toBe(reminderDedupeKey("def", 0));
  });
});

describe("reminder notification copy", () => {
  const now = new Date("2026-03-11T12:00:00Z");
  const doc = {
    recipientName: "",
    recipientEmail: "hr@abc.com",
    subject: "Application",
    sentAt: new Date("2026-03-01T12:00:00Z"),
  };

  it("mentions the company, position and elapsed days", () => {
    const c = buildReminderCopy(doc, { company: "ABC Technologies", position: "Frontend Developer" }, now);
    expect(c.title).toBe("Time to follow up!");
    expect(c.message).toContain(
      "You sent an email to ABC Technologies regarding the Frontend Developer position 10 days ago, but haven't received a response yet.",
    );
    expect(c.message).toContain("Would you like JobPilot to draft a follow-up email?");
  });

  it("falls back to the recipient and subject when no application is linked", () => {
    const c = buildReminderCopy(doc, null, now);
    expect(c.message).toContain('hr@abc.com about "Application"');
  });
});

describe("sending requires explicit approval", () => {
  it("refuses to send without confirm === true, before touching the database or Gmail", async () => {
    const attempt = sendApprovedFollowUp("64b7f0f2a1b2c3d4e5f60718", "64b7f0f2a1b2c3d4e5f60719", {
      to: "hr@abc.com",
      subject: "Re: Hi",
      body: "<p>Hello</p>",
      confirm: false as unknown as true,
    });
    await expect(attempt).rejects.toBeInstanceOf(FollowUpError);
    await expect(attempt).rejects.toMatchObject({ code: "INVALID_INPUT", status: 400 });
  });

  it("validates recipients and body before claiming the record", async () => {
    const base = { subject: "S", body: "<p>x</p>", confirm: true as const };
    await expect(
      sendApprovedFollowUp("64b7f0f2a1b2c3d4e5f60718", "64b7f0f2a1b2c3d4e5f60719", { ...base, to: "not-an-email" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      sendApprovedFollowUp("64b7f0f2a1b2c3d4e5f60718", "64b7f0f2a1b2c3d4e5f60719", { ...base, to: "a@b.com", body: "<p> </p>" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("returns NOT_FOUND for malformed ids (no DB access)", async () => {
    await expect(
      sendApprovedFollowUp("user", "nope", { to: "a@b.com", subject: "S", body: "<p>x</p>", confirm: true }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});
