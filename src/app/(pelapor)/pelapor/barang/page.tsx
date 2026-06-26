"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT, STATUS_BARANG_LABEL, STATUS_BARANG_VARIANT } from "@/lib/barang-constants";
import type { Barang } from "@/types/master";

const PAGE_SIZE = 20;

export default function BarangPelaporPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const filters = search ? { search } : undefined;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.barang.list(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        ...(search && { search }),
      });
      return fetchPaginated<Barang>(`/barang?${params.toString()}`);
    },
  });

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(0);
  }

  const columns: ColumnDef<Barang>[] = [
    {
      accessorKey: "kodeBarang",
      header: "Kode Barang",
      cell: ({ row }) => (
        <Link href={`/pelapor/barang/${row.original.id}`} className="font-mono text-sm hover:underline">
          {row.original.kodeBarang}
        </Link>
      ),
    },
    { accessorKey: "namaBarang", header: "Nama" },
    {
      id: "jenis",
      header: "Jenis",
      cell: ({ row }) => row.original.jenis.nama,
    },
    {
      id: "lokasi",
      header: "Lokasi",
      cell: ({ row }) => (
        <span>
          {row.original.lokasiTerdaftar.kodeRuangan} — {row.original.lokasiTerdaftar.namaRuangan}
        </span>
      ),
    },
    {
      id: "kondisi",
      header: "Kondisi",
      cell: ({ row }) => (
        <Badge variant={KONDISI_VARIANT[row.original.kondisi]}>
          {KONDISI_LABEL[row.original.kondisi]}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_BARANG_VARIANT[row.original.statusBarang]}>
          {STATUS_BARANG_LABEL[row.original.statusBarang]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Link href={`/pelapor/barang/${row.original.id}`}>
          <Button variant="ghost" size="icon-sm">
            <Package />
            <span className="sr-only">Lihat detail</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Data Barang</h1>
        <p className="text-sm text-muted-foreground">Cari dan lihat detail barang inventaris fakultas.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Cari kode, nama, atau jenis..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Cari
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(0);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tidak ada barang ditemukan"
          description={search ? `Tidak ada hasil untuk "${search}"` : "Belum ada data barang."}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          page={page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
