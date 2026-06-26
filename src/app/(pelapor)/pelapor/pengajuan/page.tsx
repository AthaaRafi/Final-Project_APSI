"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { StatusPengajuanBadge } from "@/components/domain/pengajuan/status-pengajuan-badge";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { JENIS_PENGAJUAN_LABEL } from "@/lib/pengajuan-constants";
import type { Pengajuan } from "@/types/master";

const PAGE_SIZE = 20;

export default function PengajuanSayaPage() {
  const [page, setPage] = useState(0);
  const [batalTarget, setBatalTarget] = useState<Pengajuan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pengajuan.mine(page, PAGE_SIZE),
    queryFn: () =>
      fetchPaginated<Pengajuan>(`/pengajuan?page=${page}&size=${PAGE_SIZE}&mine=true`),
  });

  async function handleBatal() {
    if (!batalTarget) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/pengajuan/${batalTarget.id}/batal`);
      toast.success("Pengajuan berhasil dibatalkan");
      setBatalTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["pengajuan"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal membatalkan pengajuan");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<Pengajuan>[] = [
    {
      accessorKey: "nomor",
      header: "Nomor",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.nomor}</span>
      ),
    },
    {
      accessorKey: "jenis",
      header: "Jenis",
      cell: ({ row }) => (
        <Badge variant="outline">{JENIS_PENGAJUAN_LABEL[row.original.jenis]}</Badge>
      ),
    },
    {
      id: "barang",
      header: "Barang",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <p className="text-sm font-medium">{p.barang.namaBarang}</p>
            <p className="text-xs text-muted-foreground font-mono">{p.barang.kodeBarang}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "alasan",
      header: "Alasan",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.alasan.slice(0, 60)}
          {row.original.alasan.length > 60 ? "…" : ""}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPengajuanBadge status={row.original.status} />,
    },
    {
      id: "catatan",
      header: "Catatan Admin",
      cell: ({ row }) => {
        const catatan = row.original.catatanAdmin;
        if (!catatan) return <span className="text-muted-foreground text-xs">-</span>;
        return <span className="text-sm">{catatan}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      id: "aksi",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        if (p.status !== "MENUNGGU") return null;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setBatalTarget(p)}
          >
            Batalkan
          </Button>
        );
      },
    },
  ];

  const pengajuanList = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pengajuan Saya</h1>
        <p className="text-sm text-muted-foreground">Riwayat semua pengajuan yang Anda buat</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : pengajuanList.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada pengajuan"
          description="Pengajuan Anda akan muncul di sini setelah dibuat dari halaman detail barang."
        />
      ) : (
        <DataTable
          columns={columns}
          data={pengajuanList}
          page={page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!batalTarget}
        onOpenChange={(open) => { if (!open) setBatalTarget(null); }}
        title="Batalkan Pengajuan"
        description={batalTarget ? `Yakin ingin membatalkan pengajuan ${batalTarget.nomor}?` : ""}
        confirmLabel="Ya, Batalkan"
        variant="destructive"
        loading={submitting}
        onConfirm={handleBatal}
      />
    </div>
  );
}
