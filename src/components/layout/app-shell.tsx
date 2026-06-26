"use client";

import Link from "next/link";
import { LogOut, Menu, Package } from "lucide-react";
import type { Role } from "@prisma/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav-config";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function AppShell({
  role,
  nama,
  children,
}: {
  role: Role;
  nama: string;
  children: React.ReactNode;
}) {
  const items = NAV_ITEMS[role];

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Sidebar — filled indigo gradient (§14.1) */}
      <aside className="hidden w-66 shrink-0 bg-linear-to-b from-[#4F46E5] to-[#4338CA] md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/10">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            <Package className="size-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-white">Inventaris Fakultas</span>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Sidebar items={items} />
        </div>

        {/* User info bottom */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
              {getInitials(nama)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{nama}</p>
              <p className="text-xs text-white/50">{ROLE_LABEL[role]}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — clean (§14.2 opsi B) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                      <item.icon />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="size-3.5" />
              </div>
              <span className="font-display text-sm font-bold tracking-tight">Inventaris</span>
            </div>
          </div>

          <UserMenu nama={nama} role={role} />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
