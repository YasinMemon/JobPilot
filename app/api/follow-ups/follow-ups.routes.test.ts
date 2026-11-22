import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

// Mocks stand in for the service layer; the real FollowUpError is kept.
const svc = {
  listTrackedEmails: vi.fn(),
  getFollowUpSummary: vi.fn(),
  getTrackedEmail: vi.fn(),
  generateDraft: vi.fn(),
  saveDraft: vi.fn(),
  sendApprovedFollowUp: vi.fn(),
  snoozeFollowUp: vi.fn(),
  dismissFollowUp: vi.fn(),
  checkReplyStatus: vi.fn(),
};
vi.mock("@/services/followup.service", () => {
  class FollowUpError extends Error {
    constructor(
      public code: string,
      message: string,
      public status: number,
    ) {
      super(message);
    }
  }
  return { ...svc, FollowUpError };
});

const ID = "64b7f0f2a1b2c3d4e5f60718";
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });
const json = (body: unknown, method = "POST") =>
  new NextRequest("http://localhost/api/follow-ups/x", {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
const get = (url = "http://localhost/api/follow-ups") => new NextRequest(url);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("follow-up routes — authentication", () => {
  it("rejects every endpoint without a session and never calls the service", async () => {
    getSession.mockResolvedValue(null);
    const list = await import("./route");
    const due = await import("./due/route");
    const one = await import("./[id]/route");
    const draft = await import("./[id]/draft/route");
    const send = await import("./[id]/send/route");
    const snooze = await import("./[id]/snooze/route");
    const dismiss = await import("./[id]/dismiss/route");
    const check = await import("./[id]/check-reply/route");

    const responses = await Promise.all([
      list.GET(get()),
      due.GET(get()),
      one.GET(get(), ctx()),
      draft.POST(json({}), ctx()),
      draft.PUT(json({}, "PUT"), ctx()),
      send.POST(json({}), ctx()),
      snooze.POST(json({ days: 3 }), ctx()),
      dismiss.POST(json({}), ctx()),
      check.POST(json({}), ctx()),
    ]);

    responses.forEach((r) => expect(r.status).toBe(401));
    Object.values(svc).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });
});

describe("follow-up routes — authorization and ownership", () => {
  beforeEach(() => getSession.mockResolvedValue({ user: { id: "user-1", name: "Yas" } }));

  it("scopes every call to the session user and ignores a client-supplied userId", async () => {
    svc.listTrackedEmails.mockResolvedValue([]);
    svc.getFollowUpSummary.mockResolvedValue({});
    const { GET } = await import("./route");
    const res = await GET(get("http://localhost/api/follow-ups?userId=attacker&status=pending"));
    expect(res.status).toBe(200);
    expect(svc.listTrackedEmails).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ status: ["pending"] }),
    );
    expect(svc.getFollowUpSummary).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 for another user's (or a missing) tracked email", async () => {
    svc.getTrackedEmail.mockResolvedValue(null);
    const { GET } = await import("./[id]/route");
    expect((await GET(get(), ctx())).status).toBe(404);
    expect(svc.getTrackedEmail).toHaveBeenCalledWith("user-1", ID);
  });

  it("rejects malformed ids with 400", async () => {
    const { GET } = await import("./[id]/route");
    expect((await GET(get(), ctx("nope"))).status).toBe(400);
  });

  it("maps service errors (ownership failure) to their status", async () => {
    const { FollowUpError } = await import("@/services/followup.service");
    svc.dismissFollowUp.mockRejectedValue(new FollowUpError("NOT_FOUND", "Tracked email not found.", 404));
    const { POST } = await import("./[id]/dismiss/route");
    const res = await POST(json({}), ctx());
    expect(res.status).toBe(404);
    expect(svc.dismissFollowUp).toHaveBeenCalledWith("user-1", ID);
  });
});

describe("draft generation never sends", () => {
  beforeEach(() => getSession.mockResolvedValue({ user: { id: "user-1", name: "Yas" } }));

  it("POST /draft only generates a draft", async () => {
    svc.generateDraft.mockResolvedValue({ id: ID, status: "draft_ready" });
    const { POST } = await import("./[id]/draft/route");
    const res = await POST(json({}), ctx());
    expect(res.status).toBe(200);
    expect(svc.generateDraft).toHaveBeenCalledWith("user-1", ID, "Yas");
    expect(svc.sendApprovedFollowUp).not.toHaveBeenCalled();
  });

  it("PUT /draft validates and saves without sending", async () => {
    svc.saveDraft.mockResolvedValue({ id: ID });
    const { PUT } = await import("./[id]/draft/route");
    const bad = await PUT(json({ to: "", subject: "s", body: "<p>x</p>" }, "PUT"), ctx());
    expect(bad.status).toBe(400);
    const ok = await PUT(json({ to: "a@b.com", subject: "s", body: "<p>x</p>" }, "PUT"), ctx());
    expect(ok.status).toBe(200);
    expect(svc.saveDraft).toHaveBeenCalledOnce();
    expect(svc.sendApprovedFollowUp).not.toHaveBeenCalled();
  });
});

describe("explicit approval is required to send", () => {
  beforeEach(() => getSession.mockResolvedValue({ user: { id: "user-1", name: "Yas" } }));
  const payload = { to: "hr@abc.com", subject: "Re: Hi", body: "<p>Hello</p>" };

  it("rejects a send request without confirm: true", async () => {
    const { POST } = await import("./[id]/send/route");
    expect((await POST(json(payload), ctx())).status).toBe(400);
    expect((await POST(json({ ...payload, confirm: false }), ctx())).status).toBe(400);
    expect((await POST(json({ ...payload, confirm: "yes" }), ctx())).status).toBe(400);
    expect(svc.sendApprovedFollowUp).not.toHaveBeenCalled();
  });

  it("sends exactly once when confirmed, for the session user", async () => {
    svc.sendApprovedFollowUp.mockResolvedValue({ id: ID, status: "follow_up_sent" });
    const { POST } = await import("./[id]/send/route");
    const res = await POST(json({ ...payload, confirm: true }), ctx());
    expect(res.status).toBe(200);
    expect(svc.sendApprovedFollowUp).toHaveBeenCalledOnce();
    expect(svc.sendApprovedFollowUp).toHaveBeenCalledWith("user-1", ID, expect.objectContaining(payload));
  });

  it("surfaces a send failure so the user can retry", async () => {
    const { FollowUpError } = await import("@/services/followup.service");
    svc.sendApprovedFollowUp.mockRejectedValue(new FollowUpError("GMAIL_ERROR", "Gmail request failed.", 502));
    const { POST } = await import("./[id]/send/route");
    const res = await POST(json({ ...payload, confirm: true }), ctx());
    expect(res.status).toBe(502);
    expect((await res.json()).success).toBe(false);
  });

  it("reports a duplicate/in-flight send as 409", async () => {
    const { FollowUpError } = await import("@/services/followup.service");
    svc.sendApprovedFollowUp.mockRejectedValue(new FollowUpError("SEND_IN_PROGRESS", "busy", 409));
    const { POST } = await import("./[id]/send/route");
    expect((await POST(json({ ...payload, confirm: true }), ctx())).status).toBe(409);
  });
});

describe("snooze validation", () => {
  beforeEach(() => getSession.mockResolvedValue({ user: { id: "user-1", name: "Yas" } }));

  it("accepts days or a date and rejects empty / out-of-range input", async () => {
    svc.snoozeFollowUp.mockResolvedValue({ id: ID });
    const { POST } = await import("./[id]/snooze/route");
    expect((await POST(json({}), ctx())).status).toBe(400);
    expect((await POST(json({ days: 0 }), ctx())).status).toBe(400);
    expect((await POST(json({ days: 500 }), ctx())).status).toBe(400);
    expect((await POST(json({ days: 3 }), ctx())).status).toBe(200);
    expect(
      (await POST(json({ until: "2030-01-01T09:00:00.000Z" }), ctx())).status,
    ).toBe(200);
    expect(svc.snoozeFollowUp).toHaveBeenCalledTimes(2);
  });
});
