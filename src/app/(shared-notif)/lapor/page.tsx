"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/domain/empty-state";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT } from "@/lib/barang-constants";
import type { Barang } from "@/types/master";

export default function LaporPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.barang.list(0, 10, search ? { search } : undefined),
    queryFn: () => {
      const params = new URLSearchParams({ page: "0", size: "10" });
      if (search) params.set("search", search);
      return fetchPaginated<Barang>(`/barang?${params.toString()}`);
    },
    enabled: !!search,
  });

  function handleSearch() {
    const q = searchInput.trim();
    if (!q) {
      toast.error("Masukkan kata kunci pencarian");
      return;
    }
    setSearch(q);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Lapor Kerusakan</h1>
        <p className="text-sm text-muted-foreground">
          Cari barang yang ingin dilaporkan, lalu klik untuk membuat laporan kerusakan dari halaman detail.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Cari kode atau nama barang..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>
          <Search className="size-4 mr-1" />
          Cari
        </Button>
      </div>

      {!search ? (
        <EmptyState
          icon={AlertTriangle}
          title="Cari barang terlebih dahulu"
          description="Masukkan kode atau nama barang yang ingin Anda laporkan kerusakannya."
        />
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">Mencari...</div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={Package}
          title="Tidak ditemukan"
          description={`Tidak ada barang yang cocok dengan "${search}".`}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Ditemukan {data.total} barang. Klik salah satu untuk membuat laporan.
          </p>
          <div className="divide-y rounded-lg border">
            {data.data.map((barang) => (
              <Link
                key={barang.id}
                href={`/pelapor/barang/${barang.id}`}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{barang.namaBarang}</p>
                  <p className="text-xs text-muted-foreground font-mono">{barang.kodeBarang}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={KONDISI_VARIANT[barang.kondisi]}>
                    {KONDISI_LABEL[barang.kondisi]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {barang.lokasiTerdaftar.kodeRuangan}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
