"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { ROLE_LABEL } from "@/lib/nav-config";
import { useTheme } from "@/lib/theme";
import type { Role } from "@prisma/client";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function UserMenu({ nama, role }: { nama: string; role: Role }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggle } = useTheme();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
      router.push("/login");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Gagal keluar";
      toast.error(message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/notifikasi">
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4" />
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {getInitials(nama)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">{nama}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{nama}</span>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggle}>
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={loggingOut} onClick={handleLogout}>
            <LogOut />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
