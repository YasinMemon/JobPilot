import { describe, expect, it } from "vitest";
import { sanitizeLink, serializeNotification } from "./notification.service";

describe("sanitizeLink", () => {
  it("accepts in-app paths", () => {
    expect(sanitizeLink("/dashboard/notifications")).toBe("/dashboard/notifications");
  });

  it("rejects absolute, protocol-relative and script URLs", () => {
    expect(sanitizeLink("https://evil.example")).toBeUndefined();
    expect(sanitizeLink("//evil.example")).toBeUndefined();
    expect(sanitizeLink("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeLink("")).toBeUndefined();
    expect(sanitizeLink(undefined)).toBeUndefined();
  });
});

describe("serializeNotification", () => {
  it("maps a stored document to the client shape", () => {
    const createdAt = new Date("2026-01-01T10:00:00Z");
    const out = serializeNotification({
      _id: { toString: () => "abc123" },
      type: "security",
      title: "T",
      message: "M",
      link: "",
      metadata: undefined as unknown as Record<string, unknown>,
      isRead: false,
      readAt: null,
      createdAt,
    });
    expect(out).toEqual({
      id: "abc123",
      type: "security",
      title: "T",
      message: "M",
      link: undefined,
      metadata: {},
      isRead: false,
      readAt: null,
      createdAt: createdAt.toISOString(),
    });
  });
});
