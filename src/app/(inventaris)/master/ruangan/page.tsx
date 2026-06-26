"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { RuanganFormDialog } from "@/components/domain/master/ruangan-form-dialog";
import { PenanggungJawabDialog } from "@/components/domain/master/penanggung-jawab-dialog";
import { apiClient, ApiClientError, fetchData, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CreateRuanganInput } from "@/lib/validation/ruangan";
import type { PjLaboranOption, Ruangan } from "@/types/master";
import type { Gedung } from "@/types/master";

const PAGE_SIZE = 20;
const TIPE_LABEL: Record<string, string> = {
  KELAS: "Kelas",
  LABORATORIUM: "Laboratorium",
};

export default function RuanganPage() {
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ruangan | null>(null);
  const [deleting, setDeleting] = useState<Ruangan | null>(null);
  const [assigning, setAssigning] = useState<Ruangan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.master.ruangan(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<Ruangan>(`/master/ruangan?page=${page}&size=${PAGE_SIZE}`),
  });

  const { data: gedungData } = useQuery({
    queryKey: queryKeys.master.gedung(0, 100),
    queryFn: () => fetchPaginated<Gedung>(`/master/gedung?page=0&size=100`),
  });

  const { data: pjLaboranOptions } = useQuery({
    queryKey: queryKeys.master.pjLaboranOptions(),
    queryFn: () => fetchData<PjLaboranOption[]>(`/master/ruangan/pj-laboran-options`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["master", "ruangan"] });
  }

  async function handleSubmit(values: CreateRuanganInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.put(`/master/ruangan/${editing.id}`, values);
        toast.success("Ruangan berhasil diubah");
      } else {
        await apiClient.post("/master/ruangan", values);
        toast.success("Ruangan berhasil ditambahkan");
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
      await apiClient.delete(`/master/ruangan/${deleting.id}`);
      toast.success("Ruangan berhasil dihapus");
      setDeleting(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(userIds: string[]) {
    if (!assigning) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/master/ruangan/${assigning.id}/penanggung-jawab`, { userIds });
      toast.success("Penanggung jawab berhasil diperbarui");
      setAssigning(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<Ruangan>[] = [
    { accessorKey: "kodeRuangan", header: "Kode" },
    { accessorKey: "namaRuangan", header: "Nama" },
    {
      id: "gedung",
      header: "Gedung",
      cell: ({ row }) => `${row.original.gedung.kode} - ${row.original.gedung.nama}`,
    },
    {
      id: "tipe",
      header: "Tipe",
      cell: ({ row }) => TIPE_LABEL[row.original.tipe],
    },
    { accessorKey: "lantai", header: "Lantai", cell: ({ row }) => row.original.lantai ?? "-" },
    {
      id: "pj",
      header: "Penanggung Jawab",
      cell: ({ row }) =>
        row.original.penanggungJawab.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.penanggungJawab.map((pj) => (
              <Badge key={pj.id} variant="secondary">
                {pj.user.nama}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">Belum ditetapkan</span>
        ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setAssigning(row.original)}>
            <Users />
            <span className="sr-only">Penanggung jawab</span>
          </Button>
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

  const gedungList = gedungData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ruangan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola ruangan, tipe, lantai, dan penanggung jawab.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={gedungList.length === 0}
        >
          <Plus />
          Tambah Ruangan
        </Button>
      </div>

      {gedungList.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Tambahkan gedung terlebih dahulu sebelum membuat ruangan.
        </p>
      )}

      {!isLoading && data?.data.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Belum ada ruangan"
          description="Tambahkan ruangan untuk mulai mendata barang."
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

      <RuanganFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        ruangan={editing}
        gedungList={gedungList}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <PenanggungJawabDialog
        open={!!assigning}
        onOpenChange={(open) => !open && setAssigning(null)}
        ruangan={assigning}
        options={pjLaboranOptions ?? []}
        onSubmit={handleAssign}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus ruangan?"
        description={`Ruangan "${deleting?.namaRuangan}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
