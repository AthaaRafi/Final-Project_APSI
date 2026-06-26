"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, CheckCircle, Clock, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/domain/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api/query-keys";

interface PenggunaStats {
  totalPengajuan: number;
  pengajuanMenunggu: number;
  pengajuanSelesai: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat statistik");
      const json = await res.json() as { data: PenggunaStats };
      return json.data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan pengajuan dan aktivitas Anda</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Pengajuan" value={stats?.totalPengajuan ?? 0} icon={ClipboardList} />
          <StatCard label="Menunggu" value={stats?.pengajuanMenunggu ?? 0} icon={Clock} variant={(stats?.pengajuanMenunggu ?? 0) > 0 ? "warning" : "default"} description="Dalam proses" />
          <StatCard label="Selesai" value={stats?.pengajuanSelesai ?? 0} icon={CheckCircle} variant={(stats?.pengajuanSelesai ?? 0) > 0 ? "success" : "default"} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/pelapor/pengajuan">
          <Button variant="outline" size="sm">
            <ClipboardList className="size-3.5" />
            Lihat Pengajuan Saya
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
        <Link href="/pelapor/barang">
          <Button variant="outline" size="sm">
            <Search className="size-3.5" />
            Cari Barang
          </Button>
        </Link>
      </div>
    </div>
  );
}
