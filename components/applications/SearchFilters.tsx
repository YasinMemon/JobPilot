"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { ApplicationStatus } from "@/types/applications/type";

interface SearchFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  status: ApplicationStatus | "All";
  onStatus: (value: ApplicationStatus | "All") => void;
  sort: "newest" | "oldest" | "az";
  onSort: (value: "newest" | "oldest" | "az") => void;
}

const statusOptions: { value: ApplicationStatus | "All"; label: string }[] = [
  { value: "All", label: "All Status" },
  { value: ApplicationStatus.APPLIED, label: "Applied" },
  { value: ApplicationStatus.VIEWED, label: "Viewed" },
  { value: ApplicationStatus.INTERVIEW, label: "Interview" },
  { value: ApplicationStatus.ASSESSMENT, label: "Assessment" },
  { value: ApplicationStatus.SHORTLISTED, label: "Shortlisted" },
  { value: ApplicationStatus.OFFER, label: "Offer" },
  { value: ApplicationStatus.REJECTED, label: "Rejected" },
  { value: ApplicationStatus.HIRED, label: "Hired" },
  { value: ApplicationStatus.UNKNOWN, label: "Unknown" },
];

const sortOptions: { value: "newest" | "oldest" | "az"; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "Company A–Z" },
];

export default function SearchFilters({
  search,
  onSearch,
  status,
  onStatus,
  sort,
  onSort,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
        <input
          type="text"
          placeholder="Search company, position, email…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-[#27272a] bg-[#111111] pl-10 pr-4 py-2.5 text-[13px] text-zinc-300 placeholder:text-zinc-600 transition-all duration-200 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      {/* Status filter */}
      <div className="relative flex items-center gap-1.5">
        <SlidersHorizontal className="absolute left-3 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
        <select
          value={status}
          onChange={(e) =>
            onStatus(e.target.value as ApplicationStatus | "All")
          }
          className="appearance-none w-full sm:w-auto rounded-xl border border-[#27272a] bg-[#111111] pl-9 pr-8 py-2.5 text-[13px] text-zinc-300 transition-all duration-200 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#111111]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 pointer-events-none text-zinc-600">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as "newest" | "oldest" | "az")}
          className="appearance-none w-full sm:w-auto rounded-xl border border-[#27272a] bg-[#111111] pl-4 pr-8 py-2.5 text-[13px] text-zinc-300 transition-all duration-200 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#111111]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
