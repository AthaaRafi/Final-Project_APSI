"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Notifikasi, Role } from "@/types/master";
import type { PaginatedResult } from "@/lib/api/response";

const PAGE_SIZE = 20;

const TIPE_LABEL: Record<string, string> = {
  PENGAJUAN_DISETUJUI: "Disetujui",
  PENGAJUAN_DITOLAK: "Ditolak",
  PENGAJUAN_SELESAI: "Selesai",
  PENGAJUAN_REVISI: "Revisi",
  PENGAJUAN_DIBATALKAN: "Dibatalkan",
  PENGAJUAN_BARU: "Pengajuan Baru",
  LAPORAN_BARU: "Laporan Baru",
  LAPORAN_DIPROSES: "Diproses",
  LAPORAN_DITOLAK: "Ditolak",
  LAPORAN_SELESAI: "Selesai",
};

const TIPE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENGAJUAN_DISETUJUI: "default",
  PENGAJUAN_SELESAI: "default",
  PENGAJUAN_DITOLAK: "destructive",
  PENGAJUAN_REVISI: "secondary",
  PENGAJUAN_BARU: "secondary",
  LAPORAN_BARU: "secondary",
  LAPORAN_DIPROSES: "secondary",
  LAPORAN_SELESAI: "default",
  LAPORAN_DITOLAK: "destructive",
};

/** Tentukan URL tujuan tombol "Lihat" berdasarkan role dan data notifikasi */
function resolveNotifLink(notif: Notifikasi, role: Role | undefined): string | null {
  // Jika ada barangId, arahkan ke halaman detail barang yang sesuai role
  if (notif.barangId) {
    if (role === "PJ_RUANG" || role === "LABORAN") return `/area/barang/${notif.barangId}`;
    if (role === "INVENTARIS") return `/barang/${notif.barangId}`;
    if (role === "PENGGUNA") return `/pelapor/barang/${notif.barangId}`;
    // PIMPINAN tidak punya halaman detail barang, fallback ke approval list
  }

  // Fallback ke halaman daftar pengajuan/approval sesuai role
  if (role === "PJ_RUANG" || role === "LABORAN") return "/area/approval";
  if (role === "INVENTARIS") return "/inventaris/pengajuan";
  if (role === "PENGGUNA") return "/pelapor/pengajuan";
  if (role === "PIMPINAN") return "/supervisor";

  return null;
}

export function NotifikasiList() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifikasi.list(page, PAGE_SIZE),
    queryFn: async () => {
      const res = await fetch(
        `/api/notifikasi?page=${page}&size=${PAGE_SIZE}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Gagal memuat notifikasi");
      return res.json() as Promise<PaginatedResult<Notifikasi>>;
    },
  });

  async function handleMarkAllRead() {
    try {
      await apiClient.patch("/notifikasi");
      await queryClient.invalidateQueries({ queryKey: ["notifikasi"] });
      toast.success("Semua notifikasi ditandai dibaca");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal memperbarui");
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await apiClient.patch(`/notifikasi/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["notifikasi"] });
    } catch {
      // silently ignore single-item mark read errors
    }
  }

  const items = data?.data ?? [];
  const unreadCount = items.filter((n) => !n.dibaca).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} belum dibaca</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-1" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="Tidak ada notifikasi" description="Aktivitas terbaru akan muncul di sini." />
      ) : (
        <>
          <div className="space-y-2">
            {items.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  notif.dibaca ? "bg-background" : "bg-muted/50 border-primary/20"
                }`}
                onClick={() => { if (!notif.dibaca) void handleMarkRead(notif.id); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={TIPE_VARIANT[notif.tipe] ?? "outline"} className="text-xs">
                      {TIPE_LABEL[notif.tipe] ?? notif.tipe}
                    </Badge>
                    {!notif.dibaca && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm leading-snug">{notif.pesan}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {(() => {
                  const href = resolveNotifLink(notif, user?.data?.role as Role | undefined);
                  return href ? (
                    <Link
                      href={href}
                      className="text-xs text-primary underline shrink-0 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Lihat
                    </Link>
                  ) : null;
                })()}
              </div>
            ))}
          </div>

          {/* Paginasi sederhana */}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {data?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
