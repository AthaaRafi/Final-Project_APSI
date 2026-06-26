"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { StatusPengajuanBadge } from "@/components/domain/pengajuan/status-pengajuan-badge";
import { fetchData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Pengajuan } from "@/types/master";

export default function HistoriPenghapusanPage() {
  const [tahunFilter, setTahunFilter] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.penghapusan.histori(tahunFilter),
    queryFn: () => {
      const params = tahunFilter ? `?tahun=${tahunFilter}` : "";
      return fetchData<{ data: Pengajuan[]; tahunList: number[] }>(`/penghapusan${params}`);
    },
  });

  const pengajuanList = data?.data ?? [];
  const tahunList = data?.tahunList ?? [];

  // Group by tahun
  const byTahun = pengajuanList.reduce<Record<number, Pengajuan[]>>((acc, p) => {
    const tahun = new Date(p.createdAt).getFullYear();
    if (!acc[tahun]) acc[tahun] = [];
    acc[tahun].push(p);
    return acc;
  }, {});

  const sortedTahun = Object.keys(byTahun)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Histori Penghapusan</h1>
          <p className="text-sm text-muted-foreground">
            Usulan penghapusan barang dikelompokkan per tahun anggaran (HPS-03/04).
          </p>
        </div>
      </div>

      {/* Filter tahun */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tahunFilter === undefined ? "default" : "outline"}
          onClick={() => setTahunFilter(undefined)}
        >
          Semua Tahun
        </Button>
        {tahunList.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tahunFilter === t ? "default" : "outline"}
            onClick={() => setTahunFilter(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : pengajuanList.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum ada usulan penghapusan"
          description="Usulan penghapusan dari PJ Ruang/Laboran akan muncul di sini."
        />
      ) : (
        <div className="space-y-6">
          {sortedTahun.map((tahun) => (
            <div key={tahun}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-base">Tahun {tahun}</h2>
                <Badge variant="secondary">{byTahun[tahun].length} usulan</Badge>
              </div>
              <div className="space-y-2">
                {byTahun[tahun].map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border px-4 py-3 flex items-start gap-4 text-sm"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/barang/${p.barang.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.barang.namaBarang}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.barang.kodeBarang}
                        </span>
                        <StatusPengajuanBadge status={p.status} />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Diajukan oleh <span className="font-medium">{p.pengaju.nama}</span> ·{" "}
                        {p.barang.lokasiTerdaftar.namaRuangan} ·{" "}
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {p.alasan && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Alasan:</span> {p.alasan}
                        </p>
                      )}
                      {p.catatanAdmin && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Catatan admin:</span> {p.catatanAdmin}
                        </p>
                      )}
                    </div>
                    {p.sumber && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {p.sumber.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
