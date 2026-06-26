"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { BarangFormDialog } from "@/components/domain/barang/barang-form-dialog";
import { ApiClientError, fetchPaginated, postFormData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT, STATUS_BARANG_LABEL, STATUS_BARANG_VARIANT } from "@/lib/barang-constants";
import type { Barang, JenisBarang, KategoriApproval, Ruangan } from "@/types/master";
import type { CreateBarangInput } from "@/lib/validation/barang";

const PAGE_SIZE = 20;

export default function BarangAreaPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

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

  const columns: ColumnDef<Barang>[] = [
    {
      accessorKey: "kodeBarang",
      header: "Kode Barang",
      cell: ({ row }) => (
        <Link href={`/area/barang/${row.original.id}`} className="font-mono text-sm hover:underline">
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
        <Link href={`/area/barang/${row.original.id}`}>
          <Button variant="ghost" size="icon-sm">
            <Package />
            <span className="sr-only">Detail</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Barang Ruangan</h1>
          <p className="text-sm text-muted-foreground">Daftar barang di ruangan Anda.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"><Plus className="size-4" />Tambah Barang</Button>
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
          title="Belum ada barang"
          description={search ? `Tidak ada hasil untuk "${search}"` : "Belum ada barang di ruangan Anda."}
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

      <BarangFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ruanganList={ruanganData?.data ?? []}
        jenisList={jenisData?.data ?? []}
        kategoriList={kategoriData?.data ?? []}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  );
}
