import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

/**
 * End-to-end tests of the Smart Follow-ups workflow against a real MongoDB.
 * Gmail and the AI model are mocked; notifications use the real service.
 *
 * Only runs when TEST_DB_URI is set (disposable database only):
 *   TEST_DB_URI="mongodb://localhost:27017/jobpilot_test" npm test
 */
const TEST_DB_URI = process.env.TEST_DB_URI;

vi.mock("@/lib/db", () => ({
  default: async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI as string);
    }
  },
}));
vi.mock("@/lib/mongodb", () => ({ default: Promise.resolve({}) }));

// ── Gmail fake ───────────────────────────────────────────────────────────────
const gmailState = vi.hoisted(() => ({
  threadMessages: [] as unknown[],
  threadError: null as unknown,
  sendError: null as unknown,
  sent: [] as { raw: string; threadId?: string }[],
}));

const fakeGmail = vi.hoisted(() => ({
  users: {
    threads: {
      get: async () => {
        if (gmailState.threadError) throw gmailState.threadError;
        return { data: { messages: gmailState.threadMessages } };
      },
    },
    messages: {
      get: async () => ({
        data: { payload: { headers: [{ name: "Message-ID", value: "<orig@mail.gmail.com>" }] } },
      }),
      send: async ({ requestBody }: { requestBody: { raw: string; threadId?: string } }) => {
        if (gmailState.sendError) throw gmailState.sendError;
        gmailState.sent.push(requestBody);
        return { data: { id: `fu-msg-${gmailState.sent.length}`, threadId: requestBody.threadId } };
      },
    },
  },
}));

vi.mock("@/lib/gmail/userClient", async (orig) => ({
  ...(await orig<typeof import("@/lib/gmail/userClient")>()),
  createGmailClientForUser: async () => fakeGmail,
}));

const draftMock = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock("@/services/followup.ai", async (orig) => ({
  ...(await orig<typeof import("@/services/followup.ai")>()),
  generateFollowUpDraft: draftMock.fn,
}));
vi.mock("@/lib/ai/groq", () => ({ default: {} }));

const run = TEST_DB_URI ? describe : describe.skip;

run("Smart Follow-ups workflow (MongoDB)", () => {
  let svc: typeof import("./followup.service");
  let scheduler: typeof import("./followup.scheduler");
  let Tracked: typeof import("@/models/TrackedEmail").default;
  let Notification: typeof import("@/models/Notification").default;
  let Application: typeof import("@/models/applications").default;

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const DAY = 86_400_000;
  const T0 = new Date("2026-03-01T10:00:00Z");
  const AFTER_10D = new Date(T0.getTime() + 10 * DAY + 1000);
  const noSleep = async () => undefined;

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI as string);
    svc = await import("./followup.service");
    scheduler = await import("./followup.scheduler");
    Tracked = (await import("@/models/TrackedEmail")).default;
    Notification = (await import("@/models/Notification")).default;
    Application = (await import("@/models/applications")).default;
    await Tracked.init();
    await Notification.init();
  });

  const clean = async () => {
    await Tracked.deleteMany({ userId: { $in: [userA, userB] } });
    await Notification.deleteMany({ userId: { $in: [userA, userB] } });
    await Application.deleteMany({ userId: { $in: [userA, userB] } });
  };
  beforeEach(async () => {
    await clean();
    gmailState.threadMessages = [];
    gmailState.threadError = null;
    gmailState.sendError = null;
    gmailState.sent = [];
    draftMock.fn.mockReset();
    draftMock.fn.mockResolvedValue({ subject: "Re: Application", html: "<p>Just following up.</p>" });
  });
  afterAll(async () => {
    await clean();
    await mongoose.disconnect();
  });

  const track = (over: Record<string, unknown> = {}) =>
    svc.trackSentEmail({
      userId: userA,
      to: '"Priya" <hr@abc.com>',
      senderEmail: "me@gmail.com",
      subject: "Application",
      html: "<p>Hello</p>",
      gmailMessageId: `m-${Math.random()}`,
      gmailThreadId: "t-1",
      sentAt: T0,
      ...over,
    });

  const reply = (at = "2026-03-05T10:00:00Z", from = "hr@abc.com") => ({
    id: "r1",
    labelIds: ["INBOX"],
    internalDate: String(new Date(at).getTime()),
    payload: { headers: [{ name: "From", value: from }] },
  });

  const draftOf = (userId: mongoose.Types.ObjectId, id: string) =>
    svc.generateDraft(userId, id);

  // Moves a tracked email to reminder_due through the real scheduler.
  async function dueEmail() {
    const { id } = await track();
    await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
    return id!;
  }

  describe("tracking", () => {
    it("tracks a sent email with a due date 10 days after the real send time", async () => {
      const { created, id } = await track();
      expect(created).toBe(true);
      const doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("pending");
      expect(doc?.recipientEmail).toBe("hr@abc.com");
      expect(doc?.recipientName).toBe("Priya");
      expect(doc?.nextFollowUpAt?.toISOString()).toBe("2026-03-11T10:00:00.000Z");
      expect(doc?.followUpHistory[0].type).toBe("email_sent");
    });

    it("is idempotent per Gmail message (no duplicate records)", async () => {
      await track({ gmailMessageId: "same" });
      const second = await track({ gmailMessageId: "same" });
      expect(second.created).toBe(false);
      expect(await Tracked.countDocuments({ userId: userA })).toBe(1);
    });

    it("never tracks without Gmail ids (failed sends have none)", async () => {
      await expect(track({ gmailMessageId: "" })).rejects.toThrow();
      expect(await Tracked.countDocuments({ userId: userA })).toBe(0);
    });
  });

  describe("scheduler", () => {
    it("does nothing before the 10 days have passed", async () => {
      await track();
      const r = await scheduler.runFollowUpScheduler({
        now: new Date(T0.getTime() + 9 * DAY),
        sleepFn: noSleep,
        throttleMs: 0,
      });
      expect(r.claimed).toBe(0);
      expect(await Notification.countDocuments({ userId: userA })).toBe(0);
    });

    it("creates one reminder notification linked to the tracked email and application", async () => {
      const app = await Application.create({
        userId: userA, gmailMessageId: "g1", threadId: "t-1", company: "ABC Technologies",
        position: "Frontend Developer", subject: "Application", from: "me@gmail.com", receivedAt: T0,
      });
      const { id } = await track({ applicationId: app._id });
      const r = await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      expect(r.remindersCreated).toBe(1);

      const notes = await Notification.find({ userId: userA }).lean();
      expect(notes).toHaveLength(1);
      expect(notes[0].type).toBe("follow_up_reminder");
      expect(notes[0].title).toBe("Time to follow up!");
      expect(notes[0].message).toContain("ABC Technologies regarding the Frontend Developer position");
      expect(notes[0].link).toBe(`/dashboard/follow-ups?open=${id}`);
      expect(notes[0].metadata).toMatchObject({ trackedEmailId: id, applicationId: String(app._id) });

      const doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("reminder_due");
    });

    it("is idempotent: a second run does not duplicate reminders", async () => {
      await track();
      await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      const again = await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      expect(again.remindersCreated).toBe(0);
      expect(await Notification.countDocuments({ userId: userA })).toBe(1);
    });

    it("overlapping runs never process the same record twice", async () => {
      await track();
      const opts = { now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 };
      const [a, b] = await Promise.all([
        scheduler.runFollowUpScheduler(opts),
        scheduler.runFollowUpScheduler(opts),
      ]);
      expect(a.remindersCreated + b.remindersCreated).toBe(1);
      expect(await Notification.countDocuments({ userId: userA })).toBe(1);
    });

    it("cancels the follow-up and creates no reminder when the recipient replied", async () => {
      const { id } = await track();
      gmailState.threadMessages = [reply()];
      const r = await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      expect(r.repliesDetected).toBe(1);
      expect(r.remindersCreated).toBe(0);
      const doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("replied");
      expect(doc?.replyReceivedAt?.toISOString()).toBe("2026-03-05T10:00:00.000Z");
      expect(doc?.nextFollowUpAt).toBeNull();
      expect(await Notification.countDocuments({ userId: userA })).toBe(0);
    });

    it("does not treat the user's own outgoing messages as replies", async () => {
      await track({ gmailMessageId: "orig" });
      gmailState.threadMessages = [
        { id: "orig", labelIds: ["SENT"], internalDate: String(T0.getTime()), payload: { headers: [{ name: "From", value: "me@gmail.com" }] } },
        { id: "own2", labelIds: ["SENT"], internalDate: String(T0.getTime() + 5 * DAY), payload: { headers: [{ name: "From", value: "me@gmail.com" }] } },
      ];
      const r = await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      expect(r.remindersCreated).toBe(1);
    });

    it("a late reply removes the pending reminder notification", async () => {
      const id = await dueEmail();
      expect(await Notification.countDocuments({ userId: userA })).toBe(1);

      gmailState.threadMessages = [reply("2026-03-12T10:00:00Z")];
      const later = new Date(AFTER_10D.getTime() + 2 * DAY);
      const r = await scheduler.runFollowUpScheduler({ now: later, sleepFn: noSleep, throttleMs: 0 });
      expect(r.repliesDetected).toBe(1);
      expect((await Tracked.findById(id).lean())?.status).toBe("replied");
      expect(await Notification.countDocuments({ userId: userA })).toBe(0);
    });

    it("backs off on Gmail failures, keeps the record pending, and retries later", async () => {
      const { id } = await track();
      gmailState.threadError = Object.assign(new Error("boom"), { code: 500 });
      const failed = await scheduler.runFollowUpScheduler({ now: AFTER_10D, sleepFn: noSleep, throttleMs: 0 });
      expect(failed.failed).toBe(1);
      let doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("pending");
      expect(doc?.checkFailures).toBe(1);
      expect(await Notification.countDocuments({ userId: userA })).toBe(0);

      // Within the backoff window the record is skipped.
      gmailState.threadError = null;
      const skipped = await scheduler.runFollowUpScheduler({ now: new Date(AFTER_10D.getTime() + 60_000), sleepFn: noSleep, throttleMs: 0 });
      expect(skipped.claimed).toBe(0);

      // After the backoff it succeeds.
      const ok = await scheduler.runFollowUpScheduler({ now: new Date(AFTER_10D.getTime() + 3 * 3600_000), sleepFn: noSleep, throttleMs: 0 });
      expect(ok.remindersCreated).toBe(1);
      doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("reminder_due");
      expect(doc?.checkFailures).toBe(0);
    });
  });

  describe("draft → edit → approved send", () => {
    it("generates a draft only for a due reminder, and never sends", async () => {
      const { id } = await track();
      await expect(draftOf(userA, id!)).rejects.toMatchObject({ code: "INVALID_STATE" });

      await clean();
      const dueId = await dueEmail();
      const email = await draftOf(userA, dueId);
      expect(email.status).toBe("draft_ready");
      expect(email.draft?.aiGenerated).toBe(true);
      expect(email.draft?.subject).toBe("Re: Application");
      expect(gmailState.sent).toHaveLength(0);
    });

    it("saves edits to the draft", async () => {
      const id = await dueEmail();
      await draftOf(userA, id);
      const saved = await svc.saveDraft(userA, id, { to: "other@abc.com", subject: "Edited", body: "<p>My edit</p>" });
      expect(saved.draft).toMatchObject({ to: "other@abc.com", subject: "Edited", body: "<p>My edit</p>", aiGenerated: true });
    });

    it("sends only with explicit approval, inside the original thread, and records history", async () => {
      const id = await dueEmail();
      await draftOf(userA, id);
      const input = { to: "hr@abc.com", subject: "Re: Application", body: "<p>Following up</p>" };

      await expect(svc.sendApprovedFollowUp(userA, id, { ...input, confirm: false as unknown as true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
      expect(gmailState.sent).toHaveLength(0);

      const sent = await svc.sendApprovedFollowUp(userA, id, { ...input, confirm: true });
      expect(gmailState.sent).toHaveLength(1);
      expect(gmailState.sent[0].threadId).toBe("t-1");
      expect(Buffer.from(gmailState.sent[0].raw, "base64url").toString()).toContain("In-Reply-To: <orig@mail.gmail.com>");

      expect(sent.status).toBe("follow_up_sent");
      expect(sent.followUpCount).toBe(1);
      expect(sent.nextFollowUpAt).toBeNull();
      const evt = sent.followUpHistory.find((e) => e.type === "follow_up_sent");
      expect(evt).toMatchObject({ gmailMessageId: "fu-msg-1", followUpNumber: 1, subject: "Re: Application" });
      // The reminder notification is marked read.
      expect((await Notification.findOne({ userId: userA }).lean())?.isRead).toBe(true);
    });

    it("prevents duplicate sends from double clicks / concurrent retries", async () => {
      const id = await dueEmail();
      await draftOf(userA, id);
      const input = { to: "hr@abc.com", subject: "S", body: "<p>x</p>", confirm: true as const };
      const results = await Promise.allSettled([
        svc.sendApprovedFollowUp(userA, id, input),
        svc.sendApprovedFollowUp(userA, id, input),
        svc.sendApprovedFollowUp(userA, id, input),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(gmailState.sent).toHaveLength(1);
      // A later retry after success is rejected as well.
      await expect(svc.sendApprovedFollowUp(userA, id, input)).rejects.toMatchObject({ code: "INVALID_STATE" });
      expect(gmailState.sent).toHaveLength(1);
    });

    it("keeps the draft and allows retry when Gmail fails", async () => {
      const id = await dueEmail();
      await draftOf(userA, id);
      gmailState.sendError = Object.assign(new Error("Gmail down"), { code: 500 });
      const input = { to: "hr@abc.com", subject: "Edited subject", body: "<p>Edited body</p>", confirm: true as const };

      await expect(svc.sendApprovedFollowUp(userA, id, input)).rejects.toBeInstanceOf(svc.FollowUpError);
      const doc = await Tracked.findById(id).lean();
      expect(doc?.status).toBe("draft_ready");
      expect(doc?.followUpCount).toBe(0);
      expect(doc?.draft?.subject).toBe("Edited subject");
      expect(doc?.followUpHistory.some((e) => e.type === "follow_up_failed")).toBe(true);
      expect(doc?.followUpHistory.some((e) => e.type === "follow_up_sent")).toBe(false);

      gmailState.sendError = null;
      const retry = await svc.sendApprovedFollowUp(userA, id, input);
      expect(retry.status).toBe("follow_up_sent");
    });

    it("refuses to send when the recipient has already replied", async () => {
      const id = await dueEmail();
      await draftOf(userA, id);
      gmailState.threadMessages = [reply("2026-03-12T10:00:00Z")];
      await expect(
        svc.sendApprovedFollowUp(userA, id, { to: "hr@abc.com", subject: "S", body: "<p>x</p>", confirm: true }),
      ).rejects.toMatchObject({ code: "ALREADY_REPLIED" });
      expect(gmailState.sent).toHaveLength(0);
      expect((await Tracked.findById(id).lean())?.status).toBe("replied");
    });
  });

  describe("snooze and dismiss", () => {
    it("snoozing schedules a new cycle with its own notification", async () => {
      const id = await dueEmail();
      const now = new Date();
      const snoozed = await svc.snoozeFollowUp(userA, id, { days: 3 }, now);
      expect(snoozed.status).toBe("pending");
      expect(new Date(snoozed.nextFollowUpAt!).getTime()).toBe(now.getTime() + 3 * DAY);
      expect((await Notification.findOne({ userId: userA }).lean())?.isRead).toBe(true);

      await scheduler.runFollowUpScheduler({ now: new Date(now.getTime() + 4 * DAY), sleepFn: noSleep, throttleMs: 0 });
      expect(await Notification.countDocuments({ userId: userA })).toBe(2); // new cycle → new reminder
    });

    it("rejects snooze dates in the past or too far away", async () => {
      const id = await dueEmail();
      await expect(svc.snoozeFollowUp(userA, id, { until: new Date(Date.now() - DAY) })).rejects.toMatchObject({ code: "INVALID_INPUT" });
      await expect(svc.snoozeFollowUp(userA, id, { days: 400 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    });

    it("dismissing stops all further reminders", async () => {
      const id = await dueEmail();
      const dismissed = await svc.dismissFollowUp(userA, id);
      expect(dismissed.status).toBe("dismissed");
      const r = await scheduler.runFollowUpScheduler({ now: new Date(AFTER_10D.getTime() + 40 * DAY), sleepFn: noSleep, throttleMs: 0 });
      expect(r.claimed).toBe(0);
    });
  });

  describe("ownership", () => {
    it("never exposes or mutates another user's tracked emails", async () => {
      const id = await dueEmail(); // belongs to userA
      expect(await svc.getTrackedEmail(userB, id)).toBeNull();
      expect(await svc.listTrackedEmails(userB)).toEqual([]);
      await expect(draftOf(userB, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(svc.saveDraft(userB, id, { to: "a@b.com", subject: "s", body: "<p>x</p>" })).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(svc.snoozeFollowUp(userB, id, { days: 2 })).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(svc.dismissFollowUp(userB, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        svc.sendApprovedFollowUp(userB, id, { to: "a@b.com", subject: "s", body: "<p>x</p>", confirm: true }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(gmailState.sent).toHaveLength(0);
      expect((await Tracked.findById(id).lean())?.status).toBe("reminder_due");
    });
  });
});
