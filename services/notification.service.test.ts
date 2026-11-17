import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

/**
 * Integration tests for the notification service.
 *
 * They need a real MongoDB and therefore only run when TEST_DB_URI is set.
 * Use a disposable database — the suite deletes every notification it creates
 * and the whole database is NOT dropped, but never point this at production:
 *
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

const run = TEST_DB_URI ? describe : describe.skip;

run("notification service (MongoDB)", () => {
  // Imported lazily so the skipped suite never loads mongoose models.
  let svc: typeof import("./notification.service");
  let Model: typeof import("@/models/Notification").default;

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI as string);
    svc = await import("./notification.service");
    Model = (await import("@/models/Notification")).default;
    await Model.init(); // build indexes (incl. unique dedupe index)
  });

  beforeEach(async () => {
    await Model.deleteMany({ userId: { $in: [userA, userB] } });
  });

  afterAll(async () => {
    await Model.deleteMany({ userId: { $in: [userA, userB] } });
    await mongoose.disconnect();
  });

  const make = (userId = userA, extra: Record<string, unknown> = {}) =>
    svc.createNotification({
      userId,
      type: "security",
      title: "T",
      message: "M",
      ...extra,
    });

  it("creates and persists a notification for the user", async () => {
    const { created, notification } = await make();
    expect(created).toBe(true);
    expect(notification?.isRead).toBe(false);
    expect(await Model.countDocuments({ userId: userA })).toBe(1);
  });

  it("prevents duplicates with the same dedupeKey (per user only)", async () => {
    expect((await make(userA, { dedupeKey: "k1" })).created).toBe(true);
    expect((await make(userA, { dedupeKey: "k1" })).created).toBe(false);
    // Same key for another user is a different notification.
    expect((await make(userB, { dedupeKey: "k1" })).created).toBe(true);
    expect(await Model.countDocuments({ userId: userA })).toBe(1);
  });

  it("is race-safe: concurrent creates with one key yield one row", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => make(userA, { dedupeKey: "race" })),
    );
    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(await Model.countDocuments({ userId: userA })).toBe(1);
  });

  it("drops external links but keeps in-app ones", async () => {
    const ok = await make(userA, { link: "/dashboard/applications" });
    const bad = await make(userA, { link: "https://evil.example" });
    const proto = await make(userA, { link: "//evil.example" });
    expect(ok.notification?.link).toBe("/dashboard/applications");
    expect(bad.notification?.link).toBeUndefined();
    expect(proto.notification?.link).toBeUndefined();
  });

  it("paginates newest-first with a stable cursor", async () => {
    for (let i = 0; i < 5; i++) await make(userA, { title: `n${i}` });

    const p1 = await svc.getUserNotifications(userA, { limit: 2 });
    expect(p1.items.map((n) => n.title)).toEqual(["n4", "n3"]);
    expect(p1.hasMore).toBe(true);

    const p2 = await svc.getUserNotifications(userA, {
      limit: 2,
      cursor: p1.nextCursor,
    });
    expect(p2.items.map((n) => n.title)).toEqual(["n2", "n1"]);

    const p3 = await svc.getUserNotifications(userA, {
      limit: 2,
      cursor: p2.nextCursor,
    });
    expect(p3.items.map((n) => n.title)).toEqual(["n0"]);
    expect(p3.hasMore).toBe(false);
    expect(p3.nextCursor).toBeNull();
  });

  it("keeps the unread count accurate through read / read-all / delete", async () => {
    const a = (await make(userA)).notification!;
    await make(userA);
    await make(userA);
    expect(await svc.getUnreadNotificationCount(userA)).toBe(3);

    expect(await svc.markNotificationAsRead(userA, a.id)).toBe(true);
    expect(await svc.getUnreadNotificationCount(userA)).toBe(2);

    // Idempotent: marking again does not change anything.
    expect(await svc.markNotificationAsRead(userA, a.id)).toBe(true);
    expect(await svc.getUnreadNotificationCount(userA)).toBe(2);

    expect(
      (await svc.getUserNotifications(userA, { unreadOnly: true })).items,
    ).toHaveLength(2);

    expect(await svc.markAllNotificationsAsRead(userA)).toBe(2);
    expect(await svc.getUnreadNotificationCount(userA)).toBe(0);

    expect(await svc.deleteNotification(userA, a.id)).toBe(true);
    expect(await svc.deleteNotification(userA, a.id)).toBe(false);
    expect(await Model.countDocuments({ userId: userA })).toBe(2);
  });

  it("never lets one user read or modify another user's notifications", async () => {
    const mine = (await make(userA)).notification!;
    await make(userB);

    // Listing and counting are scoped.
    expect((await svc.getUserNotifications(userB)).items.map((n) => n.id)).not.toContain(
      mine.id,
    );
    expect(await svc.getUnreadNotificationCount(userB)).toBe(1);

    // B cannot read-mark or delete A's notification.
    expect(await svc.markNotificationAsRead(userB, mine.id)).toBe(false);
    expect(await svc.deleteNotification(userB, mine.id)).toBe(false);
    expect(await Model.countDocuments({ _id: mine.id, isRead: false })).toBe(1);

    // B's "mark all" leaves A untouched.
    await svc.markAllNotificationsAsRead(userB);
    expect(await svc.getUnreadNotificationCount(userA)).toBe(1);
  });

  it("broadcasts once per user and is idempotent", async () => {
    const input = {
      type: "announcement" as const,
      title: "Hi",
      message: "All",
      dedupeKey: "announcement:test-1",
    };
    expect((await svc.createNotificationForUsers([userA, userB], input)).created).toBe(2);
    expect((await svc.createNotificationForUsers([userA, userB], input)).created).toBe(0);
  });
});
