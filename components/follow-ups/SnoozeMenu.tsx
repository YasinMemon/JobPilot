"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { AlarmClock, Loader2 } from "lucide-react";

const PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
  { label: "In 2 weeks", days: 14 },
] as const;

interface SnoozeMenuProps {
  disabled?: boolean;
  pending?: boolean;
  onSnooze: (choice: { days?: number; until?: string }) => void;
  className?: string;
  label?: string;
}

/** "Remind me later": quick presets or a custom date. */
export function SnoozeMenu({
  disabled,
  pending,
  onSnooze,
  className = "",
  label = "Remind me later",
}: SnoozeMenuProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");

  const [minDate] = useState(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );

  const choose = (choice: { days?: number; until?: string }) => {
    setOpen(false);
    onSnooze(choice);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled || pending}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-[#3f3f46] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <AlarmClock className="h-3.5 w-3.5" />
          )}
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="dark z-[70] w-60 rounded-xl border border-[#27272a] bg-[#0f0f10] p-2 shadow-2xl shadow-black/60 focus:outline-none"
        >
          <ul className="space-y-0.5">
            {PRESETS.map((p) => (
              <li key={p.days}>
                <button
                  type="button"
                  onClick={() => choose({ days: p.days })}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#18181b]"
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-[#27272a] pt-2">
            <label className="block px-1 text-[11px] text-zinc-500" htmlFor="snooze-date">
              Pick a date
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="snooze-date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-[#27272a] bg-[#111111] px-2 text-xs text-zinc-200 [color-scheme:dark]"
              />
              <button
                type="button"
                disabled={!date}
                onClick={() => choose({ until: new Date(`${date}T09:00:00`).toISOString() })}
                className="h-9 rounded-lg bg-indigo-500/20 px-3 text-xs font-medium text-indigo-200 hover:bg-indigo-500/30 disabled:opacity-40"
              >
                Set
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
