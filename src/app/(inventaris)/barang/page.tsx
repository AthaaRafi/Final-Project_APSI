"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Package, Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { StatusBarangBadge, KondisiBadge } from "@/components/domain/status-badge";
import { BarangFormDialog } from "@/components/domain/barang/barang-form-dialog";
import { apiClient, ApiClientError, fetchPaginated, postFormData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Barang, JenisBarang, KategoriApproval, Ruangan } from "@/types/master";
import type { CreateBarangInput } from "@/lib/validation/barang";

const PAGE_SIZE = 20;

// T6-01: Preset filter penanganan khusus (KP-13)
type PenangananPreset = "all" | "khusus";

export default function BarangInventarisPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [preset, setPreset] = useState<PenangananPreset>("all");
  const [deleteTarget, setDeleteTarget] = useState<Barang | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const filters: Record<string, string> = {
    ...(search && { search }),
    ...(preset === "khusus" && { penangananKhusus: "true" }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.barang.list(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        ...filters,
      });
      return fetchPaginated<Barang>(`/barang?${params.toString()}`);
    },
  });

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 100),
    queryFn: () => fetchPaginated<Ruangan>("/master/ruangan?page=0&size=100"),
  });

  const { data: jenisData } = useQuery({
    queryKey: queryKeys.master.jenisBarang(0, 100),
    queryFn: () => fetchPaginated<JenisBarang>("/master/jenis-barang?page=0&size=100"),
  });

  const { data: kategoriData } = useQuery({
    queryKey: queryKeys.kategoriApproval.list(0, 100),
    queryFn: () => fetchPaginated<KategoriApproval>("/kategori-approval?page=0&size=100"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["barang"] });
  }

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(0);
  }

  async function handleCreate(input: CreateBarangInput, foto: File) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });
      fd.append("foto", foto);
      await postFormData("/barang", fd);
      toast.success("Barang berhasil ditambahkan");
      setFormOpen(false);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/barang/${deleteTarget.id}`);
      toast.success("Barang berhasil dinonaktifkan");
      setDeleteTarget(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<Barang>[] = [
    {
      accessorKey: "kodeBarang",
      header: "Kode Barang",
      cell: ({ row }) => (
        <Link href={`/barang/${row.original.id}`} className="font-mono text-sm hover:underline">
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
      header: "Lokasi Terdaftar",
      cell: ({ row }) => row.original.lokasiTerdaftar.kodeRuangan,
    },
    {
      id: "kondisi",
      header: "Kondisi",
      cell: ({ row }) => <KondisiBadge kondisi={row.original.kondisi} />,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBarangBadge status={row.original.statusBarang} />,
    },
    {
      id: "actions",
      header: "Kode QR",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link href={`/barang/${row.original.id}`}>
            <Button variant="ghost" size="icon-sm">
              <QrCode />
              <span className="sr-only">Detail & QR</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(row.original)}>
            <Trash2 />
            <span className="sr-only">Nonaktifkan</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Data Barang</h1>
          <p className="text-sm text-muted-foreground">Kelola seluruh inventaris barang fakultas.</p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="size-4" />
          Tambah Barang
        </Button>
      </div>

      {/* T6-01: Filter penanganan khusus */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => { setPreset("all"); setPage(0); }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
            preset === "all"
              ? "border-[#4F46E5] bg-[#4F46E5] text-white shadow-md"
              : "border-border bg-white text-slate-500 hover:border-[#4F46E5]/30 hover:text-slate-700 dark:bg-card dark:text-slate-400"
          }`}
        >
          <Package className="size-3.5" />
          Semua Barang
        </button>
        <button
          onClick={() => { setPreset("khusus"); setPage(0); }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
            preset === "khusus"
              ? "border-red-500 bg-red-500 text-white shadow-md"
              : "border-border bg-white text-slate-500 hover:border-red-300 hover:text-slate-700 dark:bg-card dark:text-slate-400"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          Penanganan Khusus
        </button>
        <div className="w-px h-8 bg-border" />
        <Input
          placeholder="Cari kode, nama, atau jenis..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Cari
        </Button>
        {(search || preset !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPreset("all");
              setPage(0);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada barang" description={search ? `Tidak ada hasil untuk "${search}"` : "Tambah barang untuk memulai."} />
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

      <BarangFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ruanganList={ruanganData?.data ?? []}
        jenisList={jenisData?.data ?? []}
        kategoriList={kategoriData?.data ?? []}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Nonaktifkan barang?"
        description={`Barang "${deleteTarget?.namaBarang}" (${deleteTarget?.kodeBarang}) akan dinonaktifkan.`}
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
