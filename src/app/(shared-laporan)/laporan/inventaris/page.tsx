"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
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
import {
  KONDISI_LABEL,
  KONDISI_VARIANT,
  STATUS_BARANG_LABEL,
  STATUS_BARANG_VARIANT,
} from "@/lib/barang-constants";
import type { Barang, JenisBarang, Ruangan } from "@/types/master";

const PAGE_SIZE = 20;

const KONDISI_OPTIONS = ["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"] as const;
const STATUS_OPTIONS = [
  "NORMAL",
  "DILAPORKAN_RUSAK",
  "MENUNGGU_VALIDASI",
  "DALAM_PERAWATAN",
  "TERJADWAL_PERAWATAN",
  "HILANG",
  "DIAJUKAN_HAPUS",
  "NONAKTIF",
] as const;
const FLAG_OPTIONS = ["BELUM", "TERVERIFIKASI", "ANOMALI"] as const;
const FLAG_LABEL: Record<string, string> = {
  BELUM: "Belum Verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  ANOMALI: "Anomali",
};

export default function LaporanInventarisPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [kondisi, setKondisi] = useState("all-kondisi");
  const [statusBarang, setStatusBarang] = useState("all-status");
  const [jenisId, setJenisId] = useState("all-jenis");
  const [ruanganId, setRuanganId] = useState("all-ruangan");
  const [flagVerifikasi, setFlagVerifikasi] = useState("all-flag");
  const [tahunMin, setTahunMin] = useState("");
  const [tahunMax, setTahunMax] = useState("");

  const filters: Record<string, string> = {
    ...(search && { search }),
    ...(kondisi !== "all-kondisi" && { kondisi }),
    ...(statusBarang !== "all-status" && { statusBarang }),
    ...(jenisId !== "all-jenis" && { jenisId }),
    ...(ruanganId !== "all-ruangan" && { ruanganId }),
    ...(flagVerifikasi !== "all-flag" && { flagVerifikasi }),
    ...(tahunMin && { tahunMin }),
    ...(tahunMax && { tahunMax }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.laporan.inventaris(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        ...filters,
      });
      return fetchPaginated<Barang>(`/laporan/inventaris?${params.toString()}`);
    },
  });

  const { data: jenisData } = useQuery({
    queryKey: queryKeys.master.jenisBarang(0, 100),
    queryFn: () => fetchPaginated<JenisBarang>("/master/jenis-barang?page=0&size=100"),
  });

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>("/master/ruangan?page=0&size=200"),
  });

  function handleSearch() {
    setSearch(searchInput);
    setPage(0);
  }

  function handleReset() {
    setSearch("");
    setSearchInput("");
    setKondisi("all-kondisi");
    setStatusBarang("all-status");
    setJenisId("all-jenis");
    setRuanganId("all-ruangan");
    setFlagVerifikasi("all-flag");
    setTahunMin("");
    setTahunMax("");
    setPage(0);
  }

  const columns: ColumnDef<Barang>[] = [
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
      header: "Lokasi Terdaftar",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{row.original.lokasiTerdaftar.namaRuangan}</p>
          <p className="text-xs text-muted-foreground">{row.original.lokasiTerdaftar.gedung.nama}</p>
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
      accessorKey: "statusBarang",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_BARANG_VARIANT[row.original.statusBarang]}>
          {STATUS_BARANG_LABEL[row.original.statusBarang]}
        </Badge>
      ),
    },
    {
      accessorKey: "flagVerifikasi",
      header: "Verifikasi",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.flagVerifikasi === "TERVERIFIKASI"
              ? "default"
              : row.original.flagVerifikasi === "ANOMALI"
                ? "destructive"
                : "outline"
          }
        >
          {FLAG_LABEL[row.original.flagVerifikasi]}
        </Badge>
      ),
    },
    {
      accessorKey: "tahunPembelian",
      header: "Tahun",
    },
  ];

  const barangList = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Laporan Inventaris</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} barang · filter kondisi, status, lokasi, jenis, periode
        </p>
      </div>

      {/* Filter panel */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Cari nama / kode..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="secondary">Cari</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Select value={kondisi} onValueChange={(v) => { setKondisi(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="Kondisi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-kondisi">Semua Kondisi</SelectItem>
              {KONDISI_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>{KONDISI_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusBarang} onValueChange={(v) => { setStatusBarang(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_BARANG_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={jenisId} onValueChange={(v) => { setJenisId(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="Jenis" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-jenis">Semua Jenis</SelectItem>
              {(jenisData?.data ?? []).map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ruanganId} onValueChange={(v) => { setRuanganId(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="Ruangan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-ruangan">Semua Ruangan</SelectItem>
              {(ruanganData?.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.kodeRuangan} — {r.namaRuangan}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={flagVerifikasi} onValueChange={(v) => { setFlagVerifikasi(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="Flag Verifikasi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-flag">Semua Flag</SelectItem>
              {FLAG_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>{FLAG_LABEL[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Tahun Pembelian:</span>
          <Input
            type="number"
            placeholder="Min"
            className="w-24"
            value={tahunMin}
            onChange={(e) => { setTahunMin(e.target.value); setPage(0); }}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-24"
            value={tahunMax}
            onChange={(e) => { setTahunMax(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : barangList.length === 0 ? (
        <EmptyState icon={FileText} title="Tidak ada barang sesuai filter" />
      ) : (
        <DataTable
          columns={columns}
          data={barangList}
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
