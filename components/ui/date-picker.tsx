"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseISO(value?: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!match) return null;
  return { y: +match[1], m: +match[2] - 1, d: +match[3] };
}

/** Theme-aware date picker. `value`/`max` are YYYY-MM-DD strings. */
export default function DatePicker({
  value,
  onChange,
  max,
  placeholder = "Select date",
}: {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  placeholder?: string;
}) {
  const selected = parseISO(value);
  const maxDate = parseISO(max);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.m ?? today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setViewYear(selected?.y ?? today.getFullYear());
      setViewMonth(selected?.m ?? today.getMonth());
    }
    setOpen(!open);
  };

  const years = useMemo(() => {
    const end = maxDate?.y ?? today.getFullYear();
    return Array.from({ length: 111 }, (_, i) => end - i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isDisabled = (d: number) =>
    !!maxDate && toISO(viewYear, viewMonth, d) > toISO(maxDate.y, maxDate.m, maxDate.d);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const display = selected
    ? `${pad(selected.d)} ${MONTHS[selected.m].slice(0, 3)} ${selected.y}`
    : "";

  const selectClass =
    "rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div ref={ref} className="relative mt-1">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className={display ? "" : "text-muted-foreground"}>
          {display || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute left-0 z-50 mt-2 w-72 rounded-lg border border-border bg-background p-3 text-foreground shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-md p-1 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(+e.target.value)}
                className={selectClass}
                aria-label="Month"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(+e.target.value)}
                className={selectClass}
                aria-label="Year"
              >
                {(years.includes(viewYear) ? years : [viewYear, ...years]).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ),
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-md p-1 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const isSelected =
                selected?.y === viewYear &&
                selected.m === viewMonth &&
                selected.d === d;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={isDisabled(d)}
                  onClick={() => {
                    onChange(toISO(viewYear, viewMonth, d));
                    setOpen(false);
                  }}
                  className={`mx-auto h-8 w-8 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "border border-primary hover:bg-muted"
                        : "hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
