"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { Badge } from "@/components/ui/badge";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { createPemindahanSchema, type CreatePemindahanInput } from "@/lib/validation/pengajuan";
import type { Barang, Ruangan } from "@/types/master";

interface PemindahanDialogProps {
  barang: Barang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePemindahanInput) => Promise<void>;
  submitting?: boolean;
}

export function PemindahanDialog({
  barang,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: PemindahanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Pemindahan</DialogTitle>
        </DialogHeader>
        {open && (
          <PemindahanForm
            key={barang.id}
            barang={barang}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PemindahanForm({
  barang,
  onSubmit,
  onCancel,
  submitting,
}: {
  barang: Barang;
  onSubmit: (data: CreatePemindahanInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>(`/master/ruangan?page=0&size=200`),
  });

  const ruanganList = (ruanganData?.data ?? []).filter((r) => r.id !== barang.lokasiAktualId);

  const [selectedRuangan, setSelectedRuangan] = useState<Ruangan | null>(null);

  const form = useForm<CreatePemindahanInput>({
    resolver: zodResolver(createPemindahanSchema),
    defaultValues: {
      barangId: barang.id,
      lokasiTujuanId: "",
      alasan: "",
    },
  });

  const wajibApproval = barang.kategoriApproval?.wajibApproval;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{barang.kodeBarang}</p>
          <p className="font-medium">{barang.namaBarang}</p>
          <p className="text-muted-foreground text-xs mt-1">
            Lokasi aktual: {barang.lokasiAktual.kodeRuangan} — {barang.lokasiAktual.namaRuangan}
          </p>
        </div>

        {wajibApproval !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Kategori approval:</span>
            {wajibApproval ? (
              <Badge variant="secondary">Wajib Approval</Badge>
            ) : (
              <Badge variant="outline">Langsung Tercatat</Badge>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="lokasiTujuanId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokasi Tujuan</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  setSelectedRuangan(ruanganList.find((r) => r.id === v) ?? null);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ruangan tujuan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ruanganList.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.kodeRuangan} — {r.namaRuangan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRuangan && (
                <p className="text-xs text-muted-foreground">{selectedRuangan.gedung.nama}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alasan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alasan Pemindahan</FormLabel>
              <FormControl>
                <Input placeholder="Minimal 5 karakter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
            Batal
          </button>
          <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
            {submitting ? "Mengajukan..." : "Ajukan"}
          </button>
        </DialogFooter>
      </form>
    </Form>
  );
}
