"use client";
import { authClient } from "@/lib/auth-client";
import { User } from "@/types/user";
import { ApplicationStatus } from "@/types/applications/type";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  newSignupsThisWeek: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
}

interface AdminApplication {
  _id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  receivedAt: string;
  userName?: string;
  userAvatar?: string;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Applied: "#6366f1",
  Interview: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Hired: "#22c55e",
  Shortlisted: "#8b5cf6",
  Assessment: "#f97316",
  Viewed: "#64748b",
  Unknown: "#475569",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#475569";
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: "1px solid " + color + "55",
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
    >
      {status}
    </span>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={overlay}>
      <div style={confirmBox}>
        <p style={{ color: "#e2e8f0", marginBottom: 24, textAlign: "center" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button id="admin-confirm-cancel" onClick={onCancel} style={btnSecondary}>
            Cancel
          </button>
          <button id="admin-confirm-ok" onClick={onConfirm} style={btnDanger}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Profile Modal ───────────────────────────────────────────────────────

function UserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const fields: { label: string; value?: string | number | null }[] = [
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    { label: "Job Title", value: user.currentJobTitle },
    { label: "Company", value: user.currentCompany },
    { label: "Experience", value: user.yearsOfExperience },
    { label: "Location", value: user.currentLocation },
    { label: "Skills", value: user.skills?.join(", ") },
    { label: "Phone", value: user.phone },
    { label: "Gender", value: user.gender },
    { label: "Country", value: user.country },
    { label: "Work Mode", value: user.workMode },
    { label: "Notice Period", value: user.noticePeriod },
    { label: "Expected Salary", value: user.expectedSalary },
    {
      label: "Education",
      value: user.education?.degree
        ? `${user.education.degree} — ${user.education.university ?? ""} (${user.education.passingYear ?? ""})`
        : undefined,
    },
    { label: "LinkedIn", value: user.socialLinks?.linkedin },
    { label: "GitHub", value: user.socialLinks?.github },
    { label: "Portfolio", value: user.socialLinks?.portfolio },
    {
      label: "Joined",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : undefined,
    },
  ];

  return (
    <div style={overlay}>
      <div ref={ref} style={modal}>
        <div style={modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} style={modalAvatar} />
            ) : (
              <div style={avatarFallback}>
                {user.fullName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: 0 }}>
                {user.fullName}
              </h2>
              <span style={{ color: user.role === "admin" ? "#a78bfa" : "#94a3b8", fontSize: 13, textTransform: "capitalize" as const }}>
                {user.role}
              </span>
            </div>
          </div>
          <button id="admin-modal-close" onClick={onClose} style={closeBtn} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={modalBody}>
          {fields.map(
            (f) =>
              f.value && (
                <div key={f.label} style={fieldRow}>
                  <span style={fieldLabel}>{f.label}</span>
                  <span style={fieldValue}>{f.value}</span>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"users" | "applications">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [appTotal, setAppTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [appSearch, setAppSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchApplications = useCallback(async (q = "") => {
    setAppLoading(true);
    try {
      const res = await fetch(`/api/admin/applications?limit=50&search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
        setAppTotal(data.pagination?.total ?? 0);
      }
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); fetchStats(); }, [fetchUsers, fetchStats]);
  useEffect(() => { if (activeTab === "applications") fetchApplications(appSearch); }, [activeTab, fetchApplications, appSearch]);

  const handleDelete = (user: User) => {
    setConfirm({
      message: `Delete "${user.fullName}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
        fetchUsers(); fetchStats();
      },
    });
  };

  const handleToggleRole = (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setConfirm({
      message: `Change "${user.fullName}" to ${newRole}?`,
      onConfirm: async () => {
        setConfirm(null);
        await fetch(`/api/admin/users/${user._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        fetchUsers();
      },
    });
  };

  const handleLogout = async () => {
    localStorage.clear();
    await authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "#0a0a14", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Sidebar */}
      <aside className="flex w-full flex-row flex-wrap items-center gap-2 border-b border-[#1e1e3a] px-3 py-3 md:sticky md:top-0 md:h-screen md:min-h-screen md:w-[220px] md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-6" style={{ background: "#0f0f1e" }}>
        <div className="mr-auto flex items-center gap-2.5 md:mb-8 md:mr-0">
          <span style={{ fontSize: 24 }}>⚡</span>
          <span style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>JobPilot</span>
        </div>
        <p className="mb-2 hidden md:block" style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>ADMIN PANEL</p>
        <nav className="order-last flex w-full gap-1 md:order-none md:w-auto md:flex-col">
          {(["users", "applications"] as const).map((tab) => (
            <button
              key={tab}
              id={`admin-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "#1e1b4b" : "transparent",
                border: "none",
                color: activeTab === tab ? "#a78bfa" : "#64748b",
                padding: "10px 12px",
                borderRadius: 8,
                textAlign: "left" as const,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                minHeight: 40,
                transition: "all 0.15s",
              }}
              className="flex-1 justify-center md:w-full md:flex-none md:justify-start"
            >
              {tab === "users" ? "👥" : "📋"} {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div className="hidden flex-1 md:block" />
        <button id="admin-logout" onClick={handleLogout} className="md:w-full" style={{ minHeight: 40, background: "transparent", border: "1px solid #1e293b", color: "#ef4444", padding: "10px 12px", borderRadius: 8, textAlign: "left" as const, cursor: "pointer", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 md:px-9 md:py-8">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👥", color: "#6366f1" },
            { label: "New This Week", value: stats?.newSignupsThisWeek ?? "—", icon: "🆕", color: "#10b981" },
            { label: "Total Applications", value: stats?.totalApplications ?? "—", icon: "📋", color: "#f59e0b" },
            { label: "Interviews", value: stats?.applicationsByStatus?.["Interview"] ?? 0, icon: "🗓", color: "#8b5cf6" },
            { label: "Offers", value: stats?.applicationsByStatus?.["Offer"] ?? 0, icon: "🎉", color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#0f0f1e", border: `1px solid ${s.color}40`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + "20", color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ color: "#475569", fontSize: 12, margin: 0, marginTop: 2 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div style={{ background: "#0f0f1e", border: "1px solid #1e1e3a", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e1e3a", gap: 12, flexWrap: "wrap" as const }}>
              <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>Users</h2>
              <div className="w-full sm:w-auto" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
                <input id="admin-user-search" className="w-full min-w-0 sm:w-60" style={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#e2e8f0", padding: "8px 14px", fontSize: 13, outline: "none" }} placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select id="admin-role-filter" style={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#e2e8f0", padding: "8px 14px", fontSize: 13, outline: "none", cursor: "pointer" }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | "user" | "admin")}>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["User", "Email", "Role", "Location", "Joined", "Actions"].map((h) => (
                      <th key={h} className={h === "Email" ? "hidden md:table-cell" : h === "Location" || h === "Joined" ? "hidden lg:table-cell" : undefined} style={{ color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, padding: "12px 20px", textAlign: "left" as const, borderBottom: "1px solid #1e1e3a", whiteSpace: "nowrap" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: "48px 20px", textAlign: "center" as const, color: "#475569" }}>Loading users…</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "48px 20px", textAlign: "center" as const, color: "#475569" }}>No users found.</td></tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user._id} style={{ borderBottom: "1px solid #1a1a2e" }}>
                      <td style={{ padding: "14px 20px", fontSize: 13, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {user.avatar
                            ? <img src={user.avatar} alt={user.fullName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" as const, border: "1px solid #2d2d4e", flexShrink: 0 }} />
                            : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e1b4b", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{user.fullName?.[0]?.toUpperCase() ?? "U"}</div>
                          }
                          <div style={{ minWidth: 0 }}>
                            <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{user.fullName}</span>
                            <span className="block md:hidden" style={{ color: "#94a3b8", fontSize: 11 }}>{user.email ?? "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell" style={{ padding: "14px 20px", fontSize: 13, color: "#94a3b8", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>{user.email ?? "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        <span style={{ borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize" as const, display: "inline-block", background: user.role === "admin" ? "#7c3aed22" : "#1e293b", color: user.role === "admin" ? "#a78bfa" : "#64748b", border: user.role === "admin" ? "1px solid #7c3aed55" : "1px solid #334155" }}>
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell" style={{ padding: "14px 20px", fontSize: 13, color: "#64748b", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>{user.currentLocation ?? "—"}</td>
                      <td className="hidden lg:table-cell" style={{ padding: "14px 20px", fontSize: 13, color: "#64748b", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button id={`admin-view-${user._id}`} title="View profile" onClick={() => setSelectedUser(user)} style={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 6, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👁</button>
                          <button id={`admin-role-${user._id}`} title={user.role === "admin" ? "Demote to user" : "Promote to admin"} onClick={() => handleToggleRole(user)} style={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 6, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{user.role === "admin" ? "⬇" : "⬆"}</button>
                          <button id={`admin-delete-${user._id}`} title="Delete user" onClick={() => handleDelete(user)} style={{ background: "#1c0f0f", border: "1px solid #4b1c1c", borderRadius: 6, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: "#475569", fontSize: 12, padding: "12px 24px", borderTop: "1px solid #1a1a2e", margin: 0 }}>{filteredUsers.length} of {users.length} users</p>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div style={{ background: "#0f0f1e", border: "1px solid #1e1e3a", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e1e3a", gap: 12, flexWrap: "wrap" as const }}>
              <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>Applications <span style={{ color: "#6366f1", fontSize: 16 }}>({appTotal})</span></h2>
              <input id="admin-app-search" className="w-full min-w-0 sm:w-64" style={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#e2e8f0", padding: "8px 14px", fontSize: 13, outline: "none" }} placeholder="Search company or position…" value={appSearch} onChange={(e) => setAppSearch(e.target.value)} />
            </div>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["User", "Company", "Position", "Status", "Received"].map((h) => (
                      <th key={h} style={{ color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, padding: "12px 20px", textAlign: "left" as const, borderBottom: "1px solid #1e1e3a", whiteSpace: "nowrap" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appLoading ? (
                    <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center" as const, color: "#475569" }}>Loading…</td></tr>
                  ) : applications.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center" as const, color: "#475569" }}>No applications found.</td></tr>
                  ) : applications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: "1px solid #1a1a2e" }}>
                      <td style={{ padding: "14px 20px", fontSize: 13, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {app.userAvatar
                            ? <img src={app.userAvatar} alt={app.userName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" as const, border: "1px solid #2d2d4e" }} />
                            : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e1b4b", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{app.userName?.[0]?.toUpperCase() ?? "?"}</div>
                          }
                          <span style={{ color: "#cbd5e1" }}>{app.userName ?? "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#e2e8f0", fontWeight: 500, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>{app.company || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#94a3b8", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>{app.position || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}><StatusBadge status={app.status} /></td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748b", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const }}>
                        {app.receivedAt ? new Date(app.receivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default AdminDashboard;

// ─── Shared style objects (extracted to avoid repetition) ─────────────────────
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 };
const confirmBox: React.CSSProperties = { background: "#0f0f1e", border: "1px solid #2d2d4e", borderRadius: 16, padding: "32px 36px", maxWidth: 400, width: "100%" };
const btnSecondary: React.CSSProperties = { background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 };
const btnDanger: React.CSSProperties = { background: "#ef4444", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 };
const modal: React.CSSProperties = { background: "#0f0f1e", border: "1px solid #2d2d4e", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" };
const modalHeader: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e1e3a", flexShrink: 0 };
const modalAvatar: React.CSSProperties = { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #4f46e5" };
const avatarFallback: React.CSSProperties = { width: 48, height: 48, borderRadius: "50%", background: "#1e1b4b", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, border: "2px solid #4f46e5" };
const closeBtn: React.CSSProperties = { background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 };
const modalBody: React.CSSProperties = { padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 };
const fieldRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "10px 0", borderBottom: "1px solid #1a1a2e" };
const fieldLabel: React.CSSProperties = { color: "#475569", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 };
const fieldValue: React.CSSProperties = { color: "#cbd5e1", fontSize: 13, textAlign: "right", wordBreak: "break-word" };