import { describe, expect, it, vi } from "vitest";
import type { gmail_v1 } from "googleapis";

vi.mock("@/lib/mongodb", () => ({ default: Promise.resolve({}) }));

import {
  checkThreadForReply,
  detectRecipientReply,
  extractEmailAddress,
  extractEmailAddresses,
  type ReplyCheckTarget,
} from "./replyDetection";

const SENT_AT = new Date("2026-03-01T10:00:00Z");

const target: ReplyCheckTarget = {
  gmailMessageId: "orig",
  gmailThreadId: "thread-1",
  sentAt: SENT_AT,
  monitoredAddresses: ["hr@abc.com", "boss@abc.com"],
  senderEmail: "me@gmail.com",
};

function msg(
  id: string,
  from: string,
  at: string,
  opts: { labels?: string[]; headers?: Record<string, string> } = {},
): gmail_v1.Schema$Message {
  return {
    id,
    threadId: "thread-1",
    labelIds: opts.labels ?? ["INBOX"],
    internalDate: String(new Date(at).getTime()),
    payload: {
      headers: [
        { name: "From", value: from },
        ...Object.entries(opts.headers ?? {}).map(([name, value]) => ({ name, value })),
      ],
    },
  };
}

describe("address parsing", () => {
  it("extracts addresses from display-name headers", () => {
    expect(extractEmailAddress('"Jane Doe" <Jane@ABC.com>')).toBe("jane@abc.com");
    expect(extractEmailAddress("plain@abc.com")).toBe("plain@abc.com");
    expect(extractEmailAddress("")).toBe("");
    expect(extractEmailAddresses("A <a@x.com>, b@y.com; a@x.com")).toEqual(["a@x.com", "b@y.com"]);
  });
});

describe("detectRecipientReply", () => {
  it("does not treat the original outgoing message as a reply", () => {
    const r = detectRecipientReply(
      [msg("orig", "me@gmail.com", "2026-03-01T10:00:00Z", { labels: ["SENT"] })],
      target,
    );
    expect(r.replied).toBe(false);
  });

  it("does not treat the user's own follow-up (SENT) as a recipient reply", () => {
    const r = detectRecipientReply(
      [
        msg("orig", "me@gmail.com", "2026-03-01T10:00:00Z", { labels: ["SENT"] }),
        msg("fu1", "me@gmail.com", "2026-03-12T10:00:00Z", { labels: ["SENT"] }),
      ],
      target,
    );
    expect(r.replied).toBe(false);
  });

  it("does not count a message from the user even if mislabeled", () => {
    const r = detectRecipientReply(
      [msg("x", "Me <me@gmail.com>", "2026-03-05T10:00:00Z")],
      target,
    );
    expect(r.replied).toBe(false);
  });

  it("detects a reply from the recipient and returns the earliest one", () => {
    const r = detectRecipientReply(
      [
        msg("orig", "me@gmail.com", "2026-03-01T10:00:00Z", { labels: ["SENT"] }),
        msg("r2", "HR Team <hr@abc.com>", "2026-03-06T10:00:00Z"),
        msg("r1", "HR Team <hr@abc.com>", "2026-03-04T10:00:00Z"),
      ],
      target,
    );
    expect(r.replied).toBe(true);
    expect(r.replyMessageId).toBe("r1");
    expect(r.replyAt?.toISOString()).toBe("2026-03-04T10:00:00.000Z");
  });

  it("handles multiple recipients: a reply from any of them counts", () => {
    const r = detectRecipientReply([msg("r", "boss@abc.com", "2026-03-03T10:00:00Z")], target);
    expect(r.replied).toBe(true);
  });

  it("ignores unrelated senders in the same thread (e.g. newsletters, other people)", () => {
    const r = detectRecipientReply(
      [
        msg("a", "news@other.com", "2026-03-03T10:00:00Z"),
        msg("b", "someone@abc.com.evil.io", "2026-03-03T11:00:00Z"),
      ],
      target,
    );
    expect(r.replied).toBe(false);
  });

  it("ignores messages that predate the tracked email", () => {
    const r = detectRecipientReply([msg("old", "hr@abc.com", "2026-02-28T10:00:00Z")], target);
    expect(r.replied).toBe(false);
  });

  it("ignores auto-replies, out-of-office and bounces", () => {
    const r = detectRecipientReply(
      [
        msg("ooo", "hr@abc.com", "2026-03-02T10:00:00Z", { headers: { "Auto-Submitted": "auto-replied" } }),
        msg("prec", "hr@abc.com", "2026-03-02T11:00:00Z", { headers: { Precedence: "auto_reply" } }),
        msg("bounce", "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "2026-03-02T12:00:00Z"),
      ],
      target,
    );
    expect(r.replied).toBe(false);
  });

  it("ignores drafts", () => {
    const r = detectRecipientReply(
      [msg("d", "hr@abc.com", "2026-03-03T10:00:00Z", { labels: ["DRAFT"] })],
      target,
    );
    expect(r.replied).toBe(false);
  });
});

describe("checkThreadForReply", () => {
  const gmailWith = (get: () => Promise<unknown>) =>
    ({ users: { threads: { get } } }) as unknown as gmail_v1.Gmail;

  it("requests thread metadata and detects the reply", async () => {
    const get = vi.fn().mockResolvedValue({
      data: { messages: [msg("r", "hr@abc.com", "2026-03-04T10:00:00Z")] },
    });
    const r = await checkThreadForReply(gmailWith(get), target);
    expect(r.replied).toBe(true);
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({ id: "thread-1", format: "metadata", userId: "me" }),
    );
  });

  it("reports a deleted thread instead of throwing", async () => {
    const get = vi.fn().mockRejectedValue({ code: 404 });
    const r = await checkThreadForReply(gmailWith(get), target);
    expect(r).toEqual({ replied: false, threadFound: false });
  });

  it("propagates other errors so the scheduler can back off", async () => {
    const get = vi.fn().mockRejectedValue(Object.assign(new Error("invalid_grant"), { code: 400 }));
    await expect(checkThreadForReply(gmailWith(get), target)).rejects.toThrow("invalid_grant");
  });
});
