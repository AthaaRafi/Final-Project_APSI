"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { JadwalMaintenanceItem, JenisBarang } from "@/types/master";

export default function MaintenancePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JadwalMaintenanceItem | null>(null);
  const [deleting, setDeleting] = useState<JadwalMaintenanceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [jenisId, setJenisId] = useState("");
  const [intervalBulan, setIntervalBulan] = useState("3");

  const queryClient = useQueryClient();

  const { data: jadwalList, isLoading } = useQuery({
    queryKey: queryKeys.maintenance.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: JadwalMaintenanceItem[] }>("/maintenance");
      return res.data;
    },
  });

  const { data: jenisData } = useQuery({
    queryKey: queryKeys.master.jenisBarang(0, 100),
    queryFn: () => fetchPaginated<JenisBarang>("/master/jenis-barang?page=0&size=100"),
  });

  const jenisMap = new Map<string, JenisBarang>();
  for (const j of jenisData?.data ?? []) {
    jenisMap.set(j.id, j);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  }

  function openCreate() {
    setEditing(null);
    setJenisId("");
    setIntervalBulan("3");
    setFormOpen(true);
  }

  function openEdit(jadwal: JadwalMaintenanceItem) {
    setEditing(jadwal);
    setJenisId(jadwal.jenisId ?? "");
    setIntervalBulan(String(jadwal.intervalBulan));
    setFormOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.put(`/maintenance/${editing.id}`, {
          intervalBulan: Number(intervalBulan),
        });
        toast.success("Jadwal berhasil diubah");
      } else {
        await apiClient.post("/maintenance", {
          jenisId,
          intervalBulan: Number(intervalBulan),
        });
        toast.success("Jadwal berhasil ditambahkan");
      }
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
    if (!deleting) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/maintenance/${deleting.id}`);
      toast.success("Jadwal berhasil dihapus");
      setDeleting(null);
      invalidate();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<JadwalMaintenanceItem>[] = [
    {
      id: "jenis",
      header: "Jenis Barang",
      cell: ({ row }) => {
        const jenis = row.original.jenisId ? jenisMap.get(row.original.jenisId) : null;
        return jenis ? (
          <span>{jenis.nama} <span className="text-muted-foreground text-xs">({jenis.kode})</span></span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: "intervalBulan",
      header: "Interval",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.intervalBulan} bulan</Badge>
      ),
    },
    {
      id: "nextDue",
      header: "Jatuh Tempo Berikutnya",
      cell: ({ row }) =>
        row.original.nextDueDate
          ? new Date(row.original.nextDueDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : <span className="text-muted-foreground text-xs">Belum ditetapkan</span>,
    },
    {
      id: "createdAt",
      header: "Dibuat",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)}>
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
          <h1 className="text-lg font-semibold">Jadwal Maintenance Preventif</h1>
          <p className="text-sm text-muted-foreground">
            Atur jadwal perawatan berkala per jenis barang (MTC-05/FA-25).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Tambah Jadwal
        </Button>
      </div>

      {!isLoading && (jadwalList?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada jadwal maintenance"
          description="Tambahkan jadwal untuk mengatur perawatan berkala per jenis barang."
        />
      ) : (
        <DataTable
          columns={columns}
          data={jadwalList ?? []}
          page={0}
          size={100}
          total={jadwalList?.length ?? 0}
          totalPages={1}
          onPageChange={() => {}}
          isLoading={isLoading}
        />
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Jadwal" : "Tambah Jadwal Maintenance"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Jenis Barang</Label>
                <Select value={jenisId} onValueChange={setJenisId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis barang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(jenisData?.data ?? []).map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nama} ({j.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Interval (bulan)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={intervalBulan}
                onChange={(e) => setIntervalBulan(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Contoh: 3 = setiap 3 bulan, 6 = setiap 6 bulan
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!editing && !jenisId) || !intervalBulan}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus jadwal?"
        description="Jadwal maintenance ini akan dihapus permanen."
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
