"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { KategoriApprovalFormDialog } from "@/components/domain/kategori-approval-form-dialog";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CreateKategoriApprovalInput } from "@/lib/validation/kategori-approval";
import type { KategoriApproval } from "@/types/master";

const PAGE_SIZE = 20;

export default function KategoriApprovalPage() {
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KategoriApproval | null>(null);
  const [deleting, setDeleting] = useState<KategoriApproval | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.kategoriApproval.list(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<KategoriApproval>(`/kategori-approval?page=${page}&size=${PAGE_SIZE}`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["kategori-approval"] });
  }

  async function handleSubmit(values: CreateKategoriApprovalInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.put(`/kategori-approval/${editing.id}`, values);
        toast.success("Kategori approval berhasil diubah");
      } else {
        await apiClient.post("/kategori-approval", values);
        toast.success("Kategori approval berhasil ditambahkan");
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
      await apiClient.delete(`/kategori-approval/${deleting.id}`);
      toast.success("Kategori approval berhasil dihapus");
      setDeleting(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<KategoriApproval>[] = [
    { accessorKey: "nama", header: "Nama" },
    { accessorKey: "deskripsi", header: "Deskripsi", cell: ({ row }) => row.original.deskripsi || "-" },
    {
      id: "wajibApproval",
      header: "Approval",
      cell: ({ row }) =>
        row.original.wajibApproval ? (
          <Badge variant="default">Wajib Approval</Badge>
        ) : (
          <Badge variant="secondary">Langsung Tercatat</Badge>
        ),
    },
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
          <h1 className="text-lg font-semibold">Kategori Approval</h1>
          <p className="text-sm text-muted-foreground">
            Tentukan apakah pemindahan barang kategori ini perlu approval atau langsung tercatat.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah Kategori
        </Button>
      </div>

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Belum ada kategori approval"
          description="Tambahkan kategori untuk menentukan aturan pemindahan barang."
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

      <KategoriApprovalFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        kategori={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus kategori approval?"
        description={`Kategori "${deleting?.nama}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
