"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ElementType;
}

export default function SidebarItem({
  href,
  title,
  icon: Icon,
}: SidebarItemProps) {
  const pathname = usePathname();

  const active =
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/20 shadow-sm"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-[#1c1c1c] hover:translate-x-0.5",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-300",
        )}
      />
      <span>{title}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
      )}
    </Link>
  );
}
