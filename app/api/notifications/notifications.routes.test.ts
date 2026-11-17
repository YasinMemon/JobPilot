import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const svc = {
  getUserNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
};
vi.mock("@/services/notification.service", () => svc);

const VALID_ID = "64b7f0f2a1b2c3d4e5f60718";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (url = "http://localhost/api/notifications", init?: RequestInit) =>
  new NextRequest(url, init);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notification routes — authentication", () => {
  it("rejects every endpoint without a session (401) and never hits the service", async () => {
    getSession.mockResolvedValue(null);

    const list = await import("./route");
    const count = await import("./unread-count/route");
    const readAll = await import("./read-all/route");
    const item = await import("./[id]/route");

    const responses = await Promise.all([
      list.GET(req()),
      count.GET(req()),
      readAll.POST(req(undefined, { method: "POST" })),
      item.PATCH(req(), ctx(VALID_ID)),
      item.DELETE(req(), ctx(VALID_ID)),
    ]);

    responses.forEach((r) => expect(r.status).toBe(401));
    Object.values(svc).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });
});

describe("notification routes — authorization", () => {
  beforeEach(() => getSession.mockResolvedValue({ user: { id: "user-1" } }));

  it("always scopes service calls to the session user, ignoring any userId param", async () => {
    svc.getUserNotifications.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    const { GET } = await import("./route");

    const res = await GET(req("http://localhost/api/notifications?userId=someone-else&limit=5"));
    expect(res.status).toBe(200);
    expect(svc.getUserNotifications).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ limit: 5 }),
    );
  });

  it("returns 404 when the notification belongs to someone else / does not exist", async () => {
    svc.markNotificationAsRead.mockResolvedValue(false);
    svc.deleteNotification.mockResolvedValue(false);
    const item = await import("./[id]/route");

    expect((await item.PATCH(req(), ctx(VALID_ID))).status).toBe(404);
    expect((await item.DELETE(req(), ctx(VALID_ID))).status).toBe(404);
    expect(svc.markNotificationAsRead).toHaveBeenCalledWith("user-1", VALID_ID);
    expect(svc.deleteNotification).toHaveBeenCalledWith("user-1", VALID_ID);
  });

  it("rejects malformed ids with 400", async () => {
    const item = await import("./[id]/route");
    expect((await item.PATCH(req(), ctx("nope"))).status).toBe(400);
    expect((await item.DELETE(req(), ctx("nope"))).status).toBe(400);
    expect(svc.markNotificationAsRead).not.toHaveBeenCalled();
  });

  it("returns the unread count and marks all read for the session user", async () => {
    svc.getUnreadNotificationCount.mockResolvedValue(7);
    svc.markAllNotificationsAsRead.mockResolvedValue(7);

    const count = await import("./unread-count/route");
    const readAll = await import("./read-all/route");

    const c = await count.GET(req());
    expect(await c.json()).toEqual({ success: true, count: 7 });
    expect(svc.getUnreadNotificationCount).toHaveBeenCalledWith("user-1");

    const r = await readAll.POST(req(undefined, { method: "POST" }));
    expect(await r.json()).toEqual({ success: true, updated: 7 });
    expect(svc.markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
  });

  it("answers 400 for an invalid cursor", async () => {
    svc.getUserNotifications.mockRejectedValue(new Error("Invalid cursor"));
    const { GET } = await import("./route");
    expect((await GET(req("http://localhost/api/notifications?cursor=x"))).status).toBe(400);
  });
});
