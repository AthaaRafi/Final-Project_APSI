"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav-config";
import { queryKeys } from "@/lib/api/query-keys";

export function Sidebar({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.notifikasi.unread(),
    queryFn: async () => {
      const res = await fetch("/api/notifikasi?count=true", { credentials: "include" });
      if (!res.ok) return 0;
      const json = await res.json() as { data: { unread: number } };
      return json.data.unread;
    },
    refetchInterval: 60_000,
  });

  const unreadCount = unreadData ?? 0;

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        const isExactMatch = pathname === item.href;
        const isSubPath = item.href !== "/" && pathname.startsWith(`${item.href}/`);
        const hasMoreSpecificMatch = !isExactMatch && items.some(
          (other) => other.href !== item.href && other.href.startsWith(`${item.href}/`) && (pathname === other.href || pathname.startsWith(`${other.href}/`)),
        );
        const active = isExactMatch || (isSubPath && !hasMoreSpecificMatch);
        const Icon = item.icon;
        const isNotif = item.href === "/notifikasi";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-white text-[#4338CA] shadow-sm font-semibold"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {isNotif && unreadCount > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-4.5 text-center tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
