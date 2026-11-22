"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import ApplicationsHeader from "@/components/applications/ApplicationsHeader";
import StatsCards from "@/components/applications/StatsCards";
import SearchFilters from "@/components/applications/SearchFilters";
import ApplicationCard from "@/components/applications/ApplicationCard";
import ApplicationDrawer from "@/components/applications/ApplicationDrawer";
import EmptyState from "@/components/applications/EmptyState";
import ApplicationsSkeleton from "@/components/applications/ApplicationsSkeleton";

import { useApplications } from "@/app/hooks/useApplications";
import { useApplicationStats } from "@/app/hooks/useApplicationStats";
import { useSyncApplications } from "@/app/hooks/useSyncApplications";
import { useDeleteApplication } from "@/app/hooks/useDeleteApplication";
import { useFollowUps } from "@/app/hooks/useFollowUps";
import type { SerializedTrackedEmail } from "@/types/followups/type";

import {
  Application,
  ApplicationFilter,
  ApplicationStatus,
} from "@/types/applications/type";

// ── Pagination controls ───────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to display (max 5 visible)
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-[12px] text-zinc-600">
        Showing{" "}
        <span className="text-zinc-400 font-medium">{start}</span>–
        <span className="text-zinc-400 font-medium">{end}</span> of{" "}
        <span className="text-zinc-400 font-medium">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] bg-[#111111] text-zinc-500 text-[12px] transition-all hover:border-[#3f3f46] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-zinc-600 text-[12px]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-medium transition-all ${
                p === page
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                  : "border-[#27272a] bg-[#111111] text-zinc-500 hover:border-[#3f3f46] hover:text-zinc-200"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] bg-[#111111] text-zinc-500 text-[12px] transition-all hover:border-[#3f3f46] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
  application,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  application: Application;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#27272a] bg-[#111111] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-[15px] font-bold text-white mb-2">
          Delete Application
        </h3>
        <p className="text-[13px] text-zinc-400 leading-relaxed mb-5">
          Are you sure you want to delete the{" "}
          <span className="text-white font-medium">{application.position}</span>{" "}
          application at{" "}
          <span className="text-white font-medium">{application.company}</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-[#27272a] bg-[#1c1c1c] py-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:border-[#3f3f46] hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // ── Read initial state from URL ───────────────────────────────────────────
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">(
    (searchParams.get("status") as ApplicationStatus | "All") ?? "All",
  );
  const [sort, setSort] = useState<"newest" | "oldest" | "az">(
    (searchParams.get("sortBy") === "company"
      ? "az"
      : searchParams.get("sortOrder") === "asc"
      ? "oldest"
      : "newest") as "newest" | "oldest" | "az",
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );

  // ── Drawer + Delete state ─────────────────────────────────────────────────
  const [selected, setSelected] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>("");

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, sort]);

  // ── Build filter object for React Query ──────────────────────────────────
  const filter = useMemo((): ApplicationFilter => {
    const sortBy =
      sort === "az" ? "company" : "receivedAt";
    const sortOrder =
      sort === "oldest" ? "asc" : "desc";

    return {
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      status: statusFilter !== "All" ? statusFilter : undefined,
      sortBy: sortBy as ApplicationFilter["sortBy"],
      sortOrder,
    };
  }, [page, debouncedSearch, statusFilter, sort]);

  // ── Sync URL with current filters ────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (sort === "oldest") { params.set("sortBy", "receivedAt"); params.set("sortOrder", "asc"); }
    if (sort === "az") params.set("sortBy", "company");

    startTransition(() => {
      router.replace(
        `/dashboard/applications${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false },
      );
    });
  }, [page, debouncedSearch, statusFilter, sort, router]);

  // ── React Query hooks ─────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useApplications(filter);

  const { data: statsData, isLoading: statsLoading } = useApplicationStats();

  // Smart Follow-ups: one request for all tracked emails, grouped by application.
  const { data: followUpData } = useFollowUps();
  const followUpByApp = useMemo(() => {
    const map = new Map<string, SerializedTrackedEmail>();
    const needsAction = (e: SerializedTrackedEmail) =>
      ["reminder_due", "drafting", "draft_ready"].includes(e.status);
    for (const e of followUpData?.data ?? []) {
      if (!e.applicationId) continue;
      const cur = map.get(e.applicationId);
      // Prefer an email needing action; otherwise the newest (list is newest first).
      if (!cur || (needsAction(e) && !needsAction(cur))) map.set(e.applicationId, e);
    }
    return map;
  }, [followUpData]);
  const dueFollowUps =
    (followUpData?.summary.dueReminders ?? 0) + (followUpData?.summary.draftsReady ?? 0);

  const { mutate: syncNow, isPending: isSyncing } = useSyncApplications();

  const { mutate: deleteApp, isPending: isDeleting } = useDeleteApplication();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSync = useCallback(() => {
    setSyncMessage("");
    syncNow(undefined, {
      onSuccess: (result) => {
        if (result.imported > 0) {
          toast.success(result.message);
          setSyncMessage(result.message);
        } else {
          toast.info(result.message);
          setSyncMessage(result.message);
        }
        // Clear message after 5 seconds
        setTimeout(() => setSyncMessage(""), 5000);
      },
      onError: () => {
        toast.error("Sync failed. Please check your Google connection.");
      },
    });
  }, [syncNow]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteApp(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Application deleted.");
        setDeleteTarget(null);
        if (selected?.id === deleteTarget.id) setSelected(null);
      },
      onError: () => {
        toast.error("Failed to delete application.");
        setDeleteTarget(null);
      },
    });
  }, [deleteApp, deleteTarget, selected]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSort("newest");
    setPage(1);
  };

  const applications = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = statsData?.data;
  const hasFilters = debouncedSearch || statusFilter !== "All";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`min-h-full bg-[#0a0a0a] p-5 lg:p-8 space-y-6 transition-opacity duration-150 ${
          isFetching && !isLoading ? "opacity-70" : "opacity-100"
        }`}
      >
        {/* Header */}
        <ApplicationsHeader
          onSync={handleSync}
          isSyncing={isSyncing}
          syncMessage={syncMessage}
        />

        {isLoading ? (
          <ApplicationsSkeleton />
        ) : isError ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <p className="text-zinc-400 mb-4">Failed to load applications.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-[#27272a] bg-[#1c1c1c] px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsCards stats={stats} loading={statsLoading} />

            {dueFollowUps > 0 && (
              <Link
                href="/dashboard/follow-ups"
                className="flex items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-[13px] text-orange-200 transition-colors hover:bg-orange-500/10"
              >
                <span>
                  {dueFollowUps} follow-up{dueFollowUps === 1 ? " is" : "s are"} waiting for your action. Open an application to draft one.
                </span>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide">View all</span>
              </Link>
            )}

            {/* Filters */}
            <SearchFilters
              search={search}
              onSearch={setSearch}
              status={statusFilter}
              onStatus={setStatusFilter}
              sort={sort}
              onSort={setSort}
            />

            {/* Results count + clear */}
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-zinc-600">
                Showing{" "}
                <span className="text-zinc-400 font-medium">
                  {pagination?.total ?? 0}
                </span>{" "}
                {(pagination?.total ?? 0) === 1 ? "application" : "applications"}
              </p>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Grid or empty state */}
            {applications.length === 0 ? (
              <EmptyState onSync={handleSync} isSyncing={isSyncing} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {applications.map((app) => (
                    <div key={app.id} className="group/card relative">
                      <ApplicationCard
                        application={app}
                        onViewDetails={setSelected}
                        followUp={followUpByApp.get(app.id)}
                      />
                      {/* Delete button — appears on card hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(app);
                        }}
                        className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-lg border border-[#27272a] bg-[#0a0a0a] text-zinc-600 opacity-0 group-hover/card:opacity-100 transition-all duration-200 hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/5"
                        aria-label="Delete application"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPage={setPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Details drawer */}
      <ApplicationDrawer
        application={selected}
        onClose={() => setSelected(null)}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          application={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
