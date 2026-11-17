import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mongodb", () => ({ default: Promise.resolve({}) }));

import {
  GmailAuthError,
  isAuthFailure,
  isTransientGmailError,
  withGmailRetry,
} from "./userClient";

const noSleep = async () => undefined;

describe("gmail error classification", () => {
  it("treats 429, 5xx, rate-limit 403 and network errors as transient", () => {
    expect(isTransientGmailError({ code: 429 })).toBe(true);
    expect(isTransientGmailError({ response: { status: 503 } })).toBe(true);
    expect(isTransientGmailError(Object.assign(new Error("User-rate limit exceeded"), { code: 403 }))).toBe(true);
    expect(isTransientGmailError({ code: "ECONNRESET" })).toBe(true);
  });

  it("treats auth problems and 4xx as permanent", () => {
    expect(isAuthFailure(new Error("invalid_grant"))).toBe(true);
    expect(isAuthFailure(new GmailAuthError("no account"))).toBe(true);
    expect(isTransientGmailError(new Error("invalid_grant"))).toBe(false);
    expect(isTransientGmailError({ code: 400 })).toBe(false);
    expect(isTransientGmailError(Object.assign(new Error("Forbidden"), { code: 403 }))).toBe(false);
  });
});

describe("withGmailRetry", () => {
  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: 429 })
      .mockRejectedValueOnce({ code: 503 })
      .mockResolvedValue("ok");
    await expect(withGmailRetry(fn, { sleepFn: noSleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after the attempt limit", async () => {
    const fn = vi.fn().mockRejectedValue({ code: 500 });
    await expect(withGmailRetry(fn, { attempts: 3, sleepFn: noSleep })).rejects.toEqual({ code: 500 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry permanent errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("invalid_grant"));
    await expect(withGmailRetry(fn, { sleepFn: noSleep })).rejects.toThrow("invalid_grant");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("backs off exponentially", async () => {
    const delays: number[] = [];
    const fn = vi.fn().mockRejectedValue({ code: 429 });
    await withGmailRetry(fn, {
      attempts: 3,
      baseDelayMs: 100,
      sleepFn: async (ms) => void delays.push(ms),
    }).catch(() => undefined);
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[1]).toBeGreaterThanOrEqual(200);
  });
});
