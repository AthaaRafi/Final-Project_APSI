"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { JenisBarangFormDialog } from "@/components/domain/master/jenis-barang-form-dialog";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CreateJenisBarangInput } from "@/lib/validation/jenis-barang";
import type { JenisBarang } from "@/types/master";

const PAGE_SIZE = 20;

export default function JenisBarangPage() {
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JenisBarang | null>(null);
  const [deleting, setDeleting] = useState<JenisBarang | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.master.jenisBarang(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<JenisBarang>(`/master/jenis-barang?page=${page}&size=${PAGE_SIZE}`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["master", "jenis-barang"] });
  }

  async function handleSubmit(values: CreateJenisBarangInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.put(`/master/jenis-barang/${editing.id}`, values);
        toast.success("Jenis barang berhasil diubah");
      } else {
        await apiClient.post("/master/jenis-barang", values);
        toast.success("Jenis barang berhasil ditambahkan");
      }
      setFormOpen(false);
      setEditing(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/master/jenis-barang/${deleting.id}`);
      toast.success("Jenis barang berhasil dihapus");
      setDeleting(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<JenisBarang>[] = [
    { accessorKey: "kode", header: "Kode" },
    { accessorKey: "nama", header: "Nama" },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
          >
            <Pencil />
            <span className="sr-only">Ubah</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(row.original)}>
            <Trash2 />
            <span className="sr-only">Hapus</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Jenis Barang</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jenis barang untuk penyusunan kode barang.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah Jenis Barang
        </Button>
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Belum ada jenis barang"
          description="Tambahkan jenis barang untuk mulai mendata barang."
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

      <JenisBarangFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        jenisBarang={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus jenis barang?"
        description={`Jenis barang "${deleting?.nama}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
