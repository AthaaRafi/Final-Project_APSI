"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/domain/empty-state";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { AuditLog } from "@/types/master";

const PAGE_SIZE = 30;

const ENTITAS_OPTIONS = [
  "Barang",
  "Pengajuan",
  "StockOpname",
  "StockOpnameDetail",
  "User",
  "Ruangan",
  "Gedung",
  "JenisBarang",
];

export default function AuditTrailPage() {
  const [page, setPage] = useState(0);
  const [aktor, setAktor] = useState("");
  const [aktorInput, setAktorInput] = useState("");
  const [entitas, setEntitas] = useState("all-entitas");

  const filters: Record<string, string> = {
    ...(aktor && { aktor }),
    ...(entitas !== "all-entitas" && { entitas }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.laporan.audit(page, PAGE_SIZE, filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        ...filters,
      });
      return fetchPaginated<AuditLog>(`/laporan/audit?${params.toString()}`);
    },
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "waktu",
      header: "Waktu",
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap">
          {new Date(row.original.waktu).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      accessorKey: "entitas",
      header: "Entitas",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.entitas}
        </Badge>
      ),
    },
    {
      accessorKey: "aksi",
      header: "Aksi",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.aksi}</span>,
    },
    {
      accessorKey: "aktor",
      header: "Aktor",
      cell: ({ row }) => <span className="text-sm">{row.original.aktor}</span>,
    },
    {
      accessorKey: "detail",
      header: "Detail",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-2">
          {row.original.detail ?? "—"}
        </span>
      ),
    },
  ];

  const logs = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Audit Trail</h1>
        <p className="text-sm text-muted-foreground">Jejak aktivitas penting — siapa, apa, kapan (AUD-01).</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Filter aktor (email/id)..."
          value={aktorInput}
          onChange={(e) => setAktorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setAktor(aktorInput); setPage(0); }
          }}
          className="max-w-xs"
        />
        <Select value={entitas} onValueChange={(v) => { setEntitas(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Entitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-entitas">Semua Entitas</SelectItem>
            {ENTITAS_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => { setAktor(aktorInput); setPage(0); }}
          variant="secondary"
        >
          Cari
        </Button>
        <Button
          onClick={() => { setAktor(""); setAktorInput(""); setEntitas("all-entitas"); setPage(0); }}
          variant="outline"
        >
          Reset
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Shield} title="Belum ada aktivitas tercatat" />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          page={page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
