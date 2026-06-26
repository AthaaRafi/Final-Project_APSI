"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT } from "@/lib/barang-constants";
import type { LokasiBarangItem, Ruangan } from "@/types/master";

const PAGE_SIZE = 20;

export default function LaporanLokasiPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [ruanganId, setRuanganId] = useState("all-ruangan");

  const filters: Record<string, string> = {
    ...(search && { search }),
    ...(ruanganId !== "all-ruangan" && { ruanganId }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.laporan.lokasi(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        ...filters,
      });
      return fetchPaginated<LokasiBarangItem>(`/laporan/lokasi?${params.toString()}`);
    },
  });

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>("/master/ruangan?page=0&size=200"),
  });

  const columns: ColumnDef<LokasiBarangItem>[] = [
    {
      accessorKey: "kodeBarang",
      header: "Kode",
      cell: ({ row }) => (
        <Link href={`/barang/${row.original.id}`} className="font-mono text-xs hover:underline text-primary">
          {row.original.kodeBarang}
        </Link>
      ),
    },
    {
      accessorKey: "namaBarang",
      header: "Nama Barang",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.namaBarang}</p>
          <p className="text-xs text-muted-foreground">{row.original.jenis.nama}</p>
        </div>
      ),
    },
    {
      id: "lokasi",
      header: "Lokasi Terdaftar → Aktual",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <div>
            <p className="font-medium">{row.original.lokasiTerdaftar.namaRuangan}</p>
            <p className="text-xs text-muted-foreground">{row.original.lokasiTerdaftar.gedung.nama}</p>
          </div>
          <ArrowRight className="size-3 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium text-yellow-700 dark:text-yellow-400">
              {row.original.lokasiAktual.namaRuangan}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.lokasiAktual.gedung.nama}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "kondisi",
      header: "Kondisi",
      cell: ({ row }) => (
        <Badge variant={KONDISI_VARIANT[row.original.kondisi]}>
          {KONDISI_LABEL[row.original.kondisi]}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Diperbarui",
      cell: ({ row }) =>
        new Date(row.original.updatedAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  const items = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Laporan Lokasi Barang</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} barang dengan lokasi aktual berbeda dari lokasi terdaftar (real-time).
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Cari nama / kode..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setSearch(searchInput); setPage(0); }
          }}
          className="max-w-xs"
        />
        <Select value={ruanganId} onValueChange={(v) => { setRuanganId(v); setPage(0); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Ruangan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-ruangan">Semua Ruangan</SelectItem>
            {(ruanganData?.data ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.kodeRuangan} — {r.namaRuangan}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => { setSearch(searchInput); setPage(0); }}
          variant="secondary"
        >
          Cari
        </Button>
        <Button
          onClick={() => { setSearch(""); setSearchInput(""); setRuanganId("all-ruangan"); setPage(0); }}
          variant="outline"
        >
          Reset
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Tidak ada anomali lokasi"
          description="Semua barang memiliki lokasi aktual yang sesuai dengan lokasi terdaftar."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          page={page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
