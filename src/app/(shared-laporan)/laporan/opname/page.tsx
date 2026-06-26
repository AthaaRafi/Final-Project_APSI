"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { QrCode } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { StockOpname } from "@/types/master";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = { AKTIF: "Aktif", SELESAI: "Selesai", BATAL: "Batal" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  AKTIF: "default",
  SELESAI: "secondary",
  BATAL: "outline",
};

export default function LaporanOpnamePage() {
  const [page, setPage] = useState(0);

  // Gunakan API scan dengan size besar karena INVENTARIS dapat lihat semua
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.scan.list(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<StockOpname>(`/scan?page=${page}&size=${PAGE_SIZE}`),
  });

  const columns: ColumnDef<StockOpname>[] = [
    {
      accessorKey: "nomor",
      header: "#",
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.nomor}</span>,
    },
    {
      id: "ruangan",
      header: "Ruangan",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.ruangan.namaRuangan}</p>
          <p className="text-xs text-muted-foreground">{row.original.ruangan.gedung.nama}</p>
        </div>
      ),
    },
    {
      accessorKey: "tahunAnggaran",
      header: "Tahun",
    },
    {
      id: "admin",
      header: "Pelaksana",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{row.original.admin.nama}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "ringkasan",
      header: "Hasil",
      cell: ({ row }) => {
        const s = row.original;
        if (s.status !== "SELESAI") {
          return <span className="text-sm text-muted-foreground">{s.jumlahBarangScan} discan</span>;
        }
        return (
          <div className="text-xs space-x-2">
            <span className="text-green-600">{s.jumlahCocok} cocok</span>
            <span className="text-yellow-600">{s.jumlahTidakCocok} tdk cocok</span>
            <span className="text-destructive">{s.jumlahHilang} hilang</span>
          </div>
        );
      },
    },
    {
      id: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{new Date(row.original.tanggalScan).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>
          {row.original.waktuSelesai && (
            <p className="text-xs text-muted-foreground">
              Selesai: {new Date(row.original.waktuSelesai).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "aksi",
      header: "",
      cell: ({ row }) => (
        <Link href={`/scan/${row.original.id}`}>
          <Button size="sm" variant="outline">Detail</Button>
        </Link>
      ),
    },
  ];

  const sesiList = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Laporan Hasil Stock Opname</h1>
        <p className="text-sm text-muted-foreground">
          Arsip sesi verifikasi fisik per ruangan. Sesi SELESAI bersifat permanen (SCN-06).
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : sesiList.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Belum ada sesi stock opname"
          description="Laporan akan muncul setelah sesi scan dilakukan."
        />
      ) : (
        <DataTable
          columns={columns}
          data={sesiList}
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
