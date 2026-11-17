"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  Shield,
  Unlink,
  Zap,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface GoogleStatus {
  connected: boolean;
  provider?: string;
  email?: string;
}

export default function ConnectedAccountsTab() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // ── Fetch Google status ──────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/google-status", {
        credentials: "include",
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Failed to load account status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Connect Google ───────────────────────────────────────────────────────
  // Uses Better Auth's built-in linkSocial which embeds the userId in the
  // OAuth state — the callback associates Google with the existing user,
  // never creates a duplicate account.
  const handleConnect = async () => {
    try {
      setConnecting(true);
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard/settings?tab=connected-accounts",
      });
      // authClient.linkSocial redirects to Google — execution stops here.
    } catch {
      toast.error("Failed to start Google authorization. Please try again.");
      setConnecting(false);
    }
  };

  // ── Disconnect Google ────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await fetch("/api/account/disconnect-google", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message ?? "Failed to disconnect Google.");
        return;
      }

      toast.success("Google account disconnected successfully.");
      await fetchStatus(); // Refresh status
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Section header ─── */}
      <div>
        <h2 className="text-[15px] font-semibold text-white">
          Connected Accounts
        </h2>
        <p className="mt-1 text-[12px] text-zinc-500">
          Manage external accounts linked to your JobPilot account.
        </p>
      </div>

      {/* ── Google Account Card ─── */}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          status?.connected
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-[#27272a] bg-[#111111]"
        }`}
      >
        {/* Top accent line */}
        <div
          className={`absolute inset-x-0 top-0 h-px ${
            status?.connected
              ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
              : "bg-gradient-to-r from-transparent via-[#3f3f46] to-transparent"
          }`}
        />

        <div className="p-5">
          {/* Card header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Google icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#27272a] bg-[#1a1a1a]">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-white">Google</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {status?.connected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      <span className="text-[11px] text-zinc-500">
                        Not Connected
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            {status?.connected ? (
              <button
                id="disconnect-google-btn"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-[12px] font-medium text-rose-400 transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : (
              <button
                id="connect-google-btn"
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg shadow-purple-900/20 transition-all duration-200 hover:from-blue-500 hover:to-purple-500 hover:shadow-purple-800/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {connecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
                {connecting ? "Redirecting…" : "Connect Google"}
              </button>
            )}
          </div>

          {/* ── Connected state ─── */}
          {status?.connected && (
            <div className="space-y-3">
              {/* Email display */}
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 mb-0.5">Gmail Account</p>
                  <p className="text-[13px] font-medium text-white">
                    {status.email ?? "—"}
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400 shrink-0" />
              </div>

              {/* Enabled features */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Send, label: "Send Email" },
                  { icon: RefreshCw, label: "App Sync" },
                  { icon: Zap, label: "AI Tracking" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 py-3 px-2"
                  >
                    <Icon className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium text-center">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Not connected state ─── */}
          {!status?.connected && (
            <div className="space-y-3">
              {/* Warning banner */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-300">
                    Gmail is not connected
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Connect your Google account to unlock Gmail-powered features.
                  </p>
                </div>
              </div>

              {/* Feature list */}
              <p className="text-[11px] font-medium text-zinc-500 px-1">
                Connecting Google enables:
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Send, label: "Send Email", desc: "Send cold emails via your Gmail account" },
                  { icon: RefreshCw, label: "Application Sync", desc: "Auto-sync job application statuses" },
                  { icon: Zap, label: "AI Email Tracking", desc: "Track replies and follow-ups intelligently" },
                ].map(({ icon: Icon, label, desc }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-[#27272a] bg-[#0f0f0f] px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-zinc-200">{label}</p>
                      <p className="text-[11px] text-zinc-600">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Security note ─── */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[#27272a] bg-[#0f0f0f] px-4 py-3">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          JobPilot only requests read and send permissions on your Gmail. We
          never store your Google password and you can disconnect at any time.
        </p>
      </div>
    </div>
  );
}
