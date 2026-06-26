"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { QrCode, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { mulaiSesiSchema, type MulaiSesiInput } from "@/lib/validation/scan";
import type { Ruangan, StockOpname } from "@/types/master";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  BATAL: "Batal",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  AKTIF: "default",
  SELESAI: "secondary",
  BATAL: "outline",
};

export default function ScanListPage() {
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.scan.list(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<StockOpname>(`/scan?page=${page}&size=${PAGE_SIZE}`),
  });

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>(`/master/ruangan?page=0&size=200`),
    enabled: formOpen,
  });

  const form = useForm<MulaiSesiInput>({
    resolver: zodResolver(mulaiSesiSchema),
    defaultValues: {
      ruanganId: "",
      tahunAnggaran: new Date().getFullYear(),
      catatan: "",
    },
  });

  async function handleMulai(data: MulaiSesiInput) {
    setSubmitting(true);
    try {
      const result = await apiClient.post<{ data: StockOpname }>("/scan", data);
      toast.success("Sesi scan dimulai");
      setFormOpen(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["scan"] });
      router.push(`/scan/${result.data.id}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal memulai sesi");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<StockOpname>[] = [
    {
      accessorKey: "nomor",
      header: "#",
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.nomor}</span>,
    },
    {
      id: "ruangan",
      header: "Ruangan",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.ruangan.namaRuangan}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.original.ruangan.kodeRuangan}</p>
        </div>
      ),
    },
    {
      accessorKey: "tahunAnggaran",
      header: "Tahun",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "ringkasan",
      header: "Hasil Scan",
      cell: ({ row }) => {
        const s = row.original;
        if (s.status === "AKTIF") {
          return <span className="text-sm text-muted-foreground">{s.jumlahBarangScan} discan</span>;
        }
        return (
          <span className="text-xs space-x-2">
            <span className="text-green-600">{s.jumlahCocok} cocok</span>
            <span className="text-yellow-600">{s.jumlahTidakCocok} tdk cocok</span>
            <span className="text-destructive">{s.jumlahHilang} hilang</span>
          </span>
        );
      },
    },
    {
      accessorKey: "tanggalScan",
      header: "Tanggal",
      cell: ({ row }) =>
        new Date(row.original.tanggalScan).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      id: "aksi",
      header: "",
      cell: ({ row }) => (
        <Link href={`/scan/${row.original.id}`}>
          <Button size="sm" variant={row.original.status === "AKTIF" ? "default" : "outline"}>
            {row.original.status === "AKTIF" ? "Lanjutkan" : "Lihat"}
          </Button>
        </Link>
      ),
    },
  ];

  const sesiList = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Scan Cepat (Stock Opname)</h1>
          <p className="text-sm text-muted-foreground">Verifikasi fisik barang per ruangan</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4 mr-1" />
          Mulai Sesi Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : sesiList.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Belum ada sesi scan"
          description="Klik 'Mulai Sesi Baru' untuk memulai verifikasi fisik barang."
        />
      ) : (
        <DataTable
          columns={columns}
          data={sesiList}
          page={page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mulai Sesi Scan Baru</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleMulai)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ruanganId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ruangan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih ruangan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(ruanganData?.data ?? []).map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.kodeRuangan} — {r.namaRuangan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tahunAnggaran"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Anggaran</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2000}
                          max={2100}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="catatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Catatan singkat sesi ini" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Memulai..." : "Mulai Scan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
