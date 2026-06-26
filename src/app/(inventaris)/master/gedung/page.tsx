"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { GedungFormDialog } from "@/components/domain/master/gedung-form-dialog";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CreateGedungInput } from "@/lib/validation/gedung";
import type { Gedung } from "@/types/master";

const PAGE_SIZE = 20;

export default function GedungPage() {
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Gedung | null>(null);
  const [deleting, setDeleting] = useState<Gedung | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.master.gedung(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<Gedung>(`/master/gedung?page=${page}&size=${PAGE_SIZE}`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["master", "gedung"] });
  }

  async function handleSubmit(values: CreateGedungInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.put(`/master/gedung/${editing.id}`, values);
        toast.success("Gedung berhasil diubah");
      } else {
        await apiClient.post("/master/gedung", values);
        toast.success("Gedung berhasil ditambahkan");
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
      await apiClient.delete(`/master/gedung/${deleting.id}`);
      toast.success("Gedung berhasil dihapus");
      setDeleting(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<Gedung>[] = [
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
          <h1 className="text-lg font-semibold">Gedung</h1>
          <p className="text-sm text-muted-foreground">Kelola data gedung di lingkungan fakultas.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah Gedung
        </Button>
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada gedung"
          description="Tambahkan gedung untuk mulai mengelola ruangan."
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

      <GedungFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        gedung={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus gedung?"
        description={`Gedung "${deleting?.nama}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
