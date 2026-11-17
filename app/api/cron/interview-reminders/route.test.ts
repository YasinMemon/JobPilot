import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ default: async () => undefined }));

const find = vi.fn();
vi.mock("@/models/applications", () => ({ default: { find } }));

const notifyInterviewReminder = vi.fn();
vi.mock("@/lib/notifications/triggers", () => ({ notifyInterviewReminder }));

const HOUR = 3600_000;
const NOW = new Date("2026-03-10T12:00:00Z").getTime();

function chain(rows: unknown[]) {
  const q = { sort: () => q, limit: () => q, lean: async () => rows };
  find.mockReturnValue(q);
}

const call = async (authHeader?: string) => {
  const { GET } = await import("./route");
  return GET(
    new NextRequest("http://localhost/api/cron/interview-reminders", {
      headers: authHeader ? { authorization: authHeader } : {},
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/interview-reminders", () => {
  it("fails closed when CRON_SECRET is not configured", async () => {
    expect((await call("Bearer anything")).status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("rejects missing or wrong credentials", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong-value!")).status).toBe(401);
    expect((await call("s3cret-value")).status).toBe(401);
    expect(find).not.toHaveBeenCalled();
  });

  it("sends a 1h reminder for imminent and a 24h reminder for later interviews", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    chain([
      { _id: "a1", userId: "u1", company: "A", position: "P", interviewAt: new Date(NOW + 30 * 60_000) },
      { _id: "a2", userId: "u2", company: "B", position: "Q", interviewAt: new Date(NOW + 5 * HOUR) },
    ]);
    notifyInterviewReminder.mockResolvedValue(true);

    const res = await call("Bearer s3cret-value");
    expect(await res.json()).toEqual({ success: true, checked: 2, sent: 2, failed: 0 });
    expect(notifyInterviewReminder.mock.calls.map((c) => c[3])).toEqual(["1h", "24h"]);
  });

  it("queries only future interviews within 24h and skips closed applications", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    chain([]);
    await call("Bearer s3cret-value");

    const filter = find.mock.calls[0][0];
    expect(filter.interviewAt.$gt.getTime()).toBe(NOW);
    expect(filter.interviewAt.$lte.getTime()).toBe(NOW + 24 * HOUR);
    expect(filter.status.$nin).toEqual(expect.arrayContaining(["Rejected", "Hired"]));
  });

  it("does not count reminders that already existed (idempotent re-run)", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    chain([{ _id: "a1", userId: "u1", interviewAt: new Date(NOW + HOUR / 2) }]);
    notifyInterviewReminder.mockResolvedValue(false); // dedupe hit

    const res = await call("Bearer s3cret-value");
    expect(await res.json()).toMatchObject({ checked: 1, sent: 0, failed: 0 });
  });

  it("keeps going when one reminder fails", async () => {
    process.env.CRON_SECRET = "s3cret-value";
    chain([
      { _id: "a1", userId: "u1", interviewAt: new Date(NOW + HOUR / 2) },
      { _id: "a2", userId: "u2", interviewAt: new Date(NOW + 2 * HOUR) },
    ]);
    notifyInterviewReminder
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(true);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await call("Bearer s3cret-value");
    expect(await res.json()).toMatchObject({ checked: 2, sent: 1, failed: 1 });
  });
});
