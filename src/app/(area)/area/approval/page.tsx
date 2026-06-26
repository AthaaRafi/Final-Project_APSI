"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { ApprovalDialog } from "@/components/domain/pengajuan/approval-dialog";
import { StatusPengajuanBadge } from "@/components/domain/pengajuan/status-pengajuan-badge";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { JENIS_PENGAJUAN_LABEL } from "@/lib/pengajuan-constants";
import type { ApprovalActionInput } from "@/lib/validation/pengajuan";
import type { Pengajuan } from "@/types/master";

const PAGE_SIZE = 20;

export default function AreaApprovalPage() {
  const [page, setPage] = useState(0);
  const [approvalTarget, setApprovalTarget] = useState<Pengajuan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pengajuan.list(page, PAGE_SIZE, { status: "MENUNGGU" }),
    queryFn: () =>
      fetchPaginated<Pengajuan>(
        `/pengajuan?page=${page}&size=${PAGE_SIZE}&status=MENUNGGU`,
      ),
  });

  async function handleApproval(input: ApprovalActionInput) {
    if (!approvalTarget) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/pengajuan/${approvalTarget.id}/approval`, input);
      toast.success("Pengajuan berhasil diproses");
      setApprovalTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["pengajuan"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal memproses pengajuan");
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
            <Link href={`/area/barang/${p.barang.id}`} className="text-sm font-medium hover:underline">
              {p.barang.namaBarang}
            </Link>
            <p className="text-xs text-muted-foreground font-mono">{p.barang.kodeBarang}</p>
          </div>
        );
      },
    },
    {
      id: "keterangan",
      header: "Keterangan",
      cell: ({ row }) => {
        const p = row.original;
        if (p.jenis === "PEMINDAHAN") {
          return (
            <div className="text-xs flex items-center gap-1">
              <span>{p.barang.lokasiAktual.kodeRuangan}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{p.barang.lokasiTerdaftar.kodeRuangan}</span>
              {p.isAntarArea && (
                <Badge variant="secondary" className="ml-1">Antar Area</Badge>
              )}
            </div>
          );
        }
        return <span className="text-xs text-muted-foreground truncate max-w-32">{p.alasan}</span>;
      },
    },
    {
      id: "pengaju",
      header: "Pengaju",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pengaju.nama}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPengajuanBadge status={row.original.status} />,
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
        if (p.status !== "MENUNGGU" && p.status !== "REVISI") return null;
        return (
          <Button size="sm" onClick={() => setApprovalTarget(p)}>
            Proses
          </Button>
        );
      },
    },
  ];

  const pengajuanList = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Approval Pengajuan</h1>
        <p className="text-sm text-muted-foreground">Pengajuan yang menunggu persetujuan di area Anda</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : pengajuanList.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pengajuan menunggu" />
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

      {approvalTarget && (
        <ApprovalDialog
          pengajuan={approvalTarget}
          open={!!approvalTarget}
          onOpenChange={(open) => { if (!open) setApprovalTarget(null); }}
          onSubmit={handleApproval}
          submitting={submitting}
        />
      )}
    </div>
  );
}
