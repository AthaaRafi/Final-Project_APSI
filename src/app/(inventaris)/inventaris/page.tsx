"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Building2, ClipboardList, AlertTriangle, QrCode, CheckCircle, Wrench } from "lucide-react";

import { StatCard } from "@/components/domain/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";

interface GlobalStats {
  totalBarang: number;
  totalRuangan: number;
  barangPerKondisi: Record<string, number>;
  barangPerStatus: Record<string, number>;
  pengajuanMenunggu: number;
  sesiAktif: number;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function InventarisDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat statistik");
      const json = await res.json() as { data: GlobalStats };
      return json.data;
    },
  });

  const barangKhusus = (stats?.barangPerStatus?.["HILANG"] ?? 0)
    + (stats?.barangPerStatus?.["DIAJUKAN_HAPUS"] ?? 0)
    + (stats?.barangPerStatus?.["RUSAK_BERAT"] ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard Global</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan inventaris seluruh fakultas</p>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Barang" value={stats?.totalBarang ?? 0} icon={Box} description="Barang aktif terdaftar" />
            <StatCard label="Total Ruangan" value={stats?.totalRuangan ?? 0} icon={Building2} />
            <StatCard label="Pengajuan Menunggu" value={stats?.pengajuanMenunggu ?? 0} icon={ClipboardList} variant={(stats?.pengajuanMenunggu ?? 0) > 0 ? "warning" : "default"} description="Perlu tindak lanjut" />
            <StatCard label="Penanganan Khusus" value={barangKhusus} icon={AlertTriangle} variant={barangKhusus > 0 ? "danger" : "default"} description="Hilang / Diajukan Hapus / Rusak Berat" />
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Kondisi Barang</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Baik" value={stats?.barangPerKondisi?.["BAIK"] ?? 0} icon={CheckCircle} variant="success" />
              <StatCard label="Rusak Ringan" value={stats?.barangPerKondisi?.["RUSAK_RINGAN"] ?? 0} icon={Wrench} variant="warning" />
              <StatCard label="Rusak Berat" value={stats?.barangPerKondisi?.["RUSAK_BERAT"] ?? 0} icon={AlertTriangle} variant="danger" />
            </div>
          </div>

          {(stats?.sesiAktif ?? 0) > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <QrCode className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{stats?.sesiAktif} sesi stock opname sedang aktif</p>
                <p className="text-xs text-muted-foreground">Verifikasi fisik barang sedang berjalan</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
