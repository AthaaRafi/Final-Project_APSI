"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, ClipboardList, AlertTriangle, QrCode, CheckCircle, Wrench } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/domain/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api/query-keys";

interface AreaStats {
  totalBarang: number;
  barangPerKondisi: Record<string, number>;
  barangPenangananKhusus: number;
  pengajuanMenunggu: number;
  sesiAktif: number;
}

export default function AreaDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat statistik");
      const json = await res.json() as { data: AreaStats };
      return json.data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard Area</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan barang dan aktivitas ruangan Anda</p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Barang" value={stats?.totalBarang ?? 0} icon={Box} description="Di ruangan Anda" />
            <StatCard label="Approval Menunggu" value={stats?.pengajuanMenunggu ?? 0} icon={ClipboardList} variant={(stats?.pengajuanMenunggu ?? 0) > 0 ? "warning" : "default"} description="Perlu persetujuan" />
            <StatCard label="Penanganan Khusus" value={stats?.barangPenangananKhusus ?? 0} icon={AlertTriangle} variant={(stats?.barangPenangananKhusus ?? 0) > 0 ? "danger" : "default"} description="Hilang / Rusak Berat / Diajukan Hapus" />
            <StatCard label="Sesi Scan Aktif" value={stats?.sesiAktif ?? 0} icon={QrCode} variant={(stats?.sesiAktif ?? 0) > 0 ? "warning" : "default"} />
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Kondisi Barang</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Baik" value={stats?.barangPerKondisi?.["BAIK"] ?? 0} icon={CheckCircle} variant="success" />
              <StatCard label="Rusak Ringan" value={stats?.barangPerKondisi?.["RUSAK_RINGAN"] ?? 0} icon={Wrench} variant="warning" />
              <StatCard label="Rusak Berat" value={stats?.barangPerKondisi?.["RUSAK_BERAT"] ?? 0} icon={AlertTriangle} variant="danger" />
            </div>
          </div>

          {(stats?.pengajuanMenunggu ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">Ada {stats?.pengajuanMenunggu} pengajuan menunggu persetujuan</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tinjau dan berikan keputusan</p>
              </div>
              <Link href="/area/approval">
                <Button size="sm">Lihat Approval</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
