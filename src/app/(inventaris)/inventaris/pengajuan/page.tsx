"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { ApprovalDialog } from "@/components/domain/pengajuan/approval-dialog";
import { StatusPengajuanBadge } from "@/components/domain/pengajuan/status-pengajuan-badge";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { JENIS_PENGAJUAN_LABEL } from "@/lib/pengajuan-constants";
import type { ApprovalActionInput } from "@/lib/validation/pengajuan";
import type { JenisPengajuan, Pengajuan, StatusPengajuan } from "@/types/master";

const PAGE_SIZE = 20;

const JENIS_OPTIONS: { value: JenisPengajuan | ""; label: string }[] = [
  { value: "", label: "Semua Jenis" },
  { value: "PEMINDAHAN", label: "Pemindahan" },
  { value: "KERUSAKAN", label: "Laporan Kerusakan" },
  { value: "PENGHAPUSAN", label: "Usulan Penghapusan" },
];

const STATUS_OPTIONS: { value: StatusPengajuan | ""; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "REVISI", label: "Revisi" },
  { value: "SELESAI", label: "Selesai" },
  { value: "LANGSUNG_TERCATAT", label: "Langsung Tercatat" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

export default function InventarisPengajuanPage() {
  const [page, setPage] = useState(0);
  const [jenis, setJenis] = useState<JenisPengajuan | "">("");
  const [status, setStatus] = useState<StatusPengajuan | "">("");
  const [approvalTarget, setApprovalTarget] = useState<Pengajuan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const filters: Record<string, string> = {};
  if (jenis) filters.jenis = jenis;
  if (status) filters.status = status;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pengajuan.list(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
      if (jenis) params.set("jenis", jenis);
      if (status) params.set("status", status);
      return fetchPaginated<Pengajuan>(`/pengajuan?${params.toString()}`);
    },
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
            <Link href={`/barang/${p.barang.id}`} className="text-sm font-medium hover:underline">
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
        return <span className="text-xs text-muted-foreground">{p.alasan.slice(0, 60)}{p.alasan.length > 60 ? "…" : ""}</span>;
      },
    },
    {
      id: "pengaju",
      header: "Pengaju",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{row.original.pengaju.nama}</p>
          <p className="text-xs text-muted-foreground">{row.original.pengaju.role}</p>
        </div>
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
        const bisaProses =
          (p.jenis === "PENGHAPUSAN" || p.jenis === "KERUSAKAN") &&
          (p.status === "MENUNGGU" || p.status === "REVISI");
        if (!bisaProses) return null;
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
        <h1 className="text-xl font-semibold">Semua Pengajuan</h1>
        <p className="text-sm text-muted-foreground">Kelola pengajuan kerusakan dan penghapusan barang</p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={jenis || "all-jenis"}
          onValueChange={(v) => { setJenis(v === "all-jenis" ? "" : v as JenisPengajuan); setPage(0); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            {JENIS_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all-jenis"} value={o.value || "all-jenis"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || "all-status"}
          onValueChange={(v) => { setStatus(v === "all-status" ? "" : v as StatusPengajuan); setPage(0); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all-status"} value={o.value || "all-status"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : pengajuanList.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pengajuan ditemukan" />
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
