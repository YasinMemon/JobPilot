import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const runFollowUpScheduler = vi.fn();
vi.mock("@/services/followup.scheduler", () => ({ runFollowUpScheduler }));

const call = async (authHeader?: string) => {
  const { GET } = await import("./route");
  return GET(
    new NextRequest("http://localhost/api/cron/follow-ups", {
      headers: authHeader ? { authorization: authHeader } : {},
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "s3cret";
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/follow-ups", () => {
  it("fails closed when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer anything")).status).toBe(401);
    expect(runFollowUpScheduler).not.toHaveBeenCalled();
  });

  it("rejects missing or wrong credentials", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect((await call("s3cret")).status).toBe(401);
    expect(runFollowUpScheduler).not.toHaveBeenCalled();
  });

  it("runs the scheduler with valid credentials", async () => {
    runFollowUpScheduler.mockResolvedValue({ claimed: 2, remindersCreated: 1 });
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, claimed: 2, remindersCreated: 1 });
  });

  it("returns 500 without leaking details when the run crashes", async () => {
    runFollowUpScheduler.mockRejectedValue(new Error("db password is hunter2"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("hunter2");
  });
});
