"use client";

import { useQuery } from "@tanstack/react-query";
import { Box, Building2, ClipboardList, AlertTriangle, CheckCircle, Wrench, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/domain/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api/query-keys";

interface GlobalStats {
  totalBarang: number;
  totalRuangan: number;
  barangPerKondisi: Record<string, number>;
  barangPerStatus: Record<string, number>;
  pengajuanMenunggu: number;
  sesiAktif: number;
}

export default function SupervisorDashboardPage() {
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard Pemantauan</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan inventaris fakultas (read-only)</p>
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
            <StatCard label="Total Barang" value={stats?.totalBarang ?? 0} icon={Box} />
            <StatCard label="Total Ruangan" value={stats?.totalRuangan ?? 0} icon={Building2} />
            <StatCard label="Pengajuan Menunggu" value={stats?.pengajuanMenunggu ?? 0} icon={ClipboardList} variant={(stats?.pengajuanMenunggu ?? 0) > 0 ? "warning" : "default"} />
            <StatCard label="Penanganan Khusus" value={barangKhusus} icon={AlertTriangle} variant={barangKhusus > 0 ? "danger" : "default"} />
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Kondisi Barang</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Baik" value={stats?.barangPerKondisi?.["BAIK"] ?? 0} icon={CheckCircle} variant="success" />
              <StatCard label="Rusak Ringan" value={stats?.barangPerKondisi?.["RUSAK_RINGAN"] ?? 0} icon={Wrench} variant="warning" />
              <StatCard label="Rusak Berat" value={stats?.barangPerKondisi?.["RUSAK_BERAT"] ?? 0} icon={AlertTriangle} variant="danger" />
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/laporan">
              <Button variant="outline" size="sm">
                <FileText className="size-3.5" />
                Lihat Laporan
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
