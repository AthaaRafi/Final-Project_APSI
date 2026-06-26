"use client";

import { useState } from "react";
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
import { createPenghapusanSchema, type CreatePenghapusanInput } from "@/lib/validation/pengajuan";
import type { Barang } from "@/types/master";

const SUMBER_OPTIONS = [
  { value: "MANUAL", label: "Manual (inisiatif PJ)" },
  { value: "LAPORAN_KERUSAKAN", label: "Dari Laporan Kerusakan" },
  { value: "STOCK_OPNAME", label: "Dari Stock Opname" },
] as const;

interface PenghapusanDialogProps {
  barang: Barang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePenghapusanInput, foto: File | null) => Promise<void>;
  submitting?: boolean;
}

export function PenghapusanDialog({
  barang,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: PenghapusanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usulan Penghapusan</DialogTitle>
        </DialogHeader>
        {open && (
          <PenghapusanForm
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

function PenghapusanForm({
  barang,
  onSubmit,
  onCancel,
  submitting,
}: {
  barang: Barang;
  onSubmit: (data: CreatePenghapusanInput, foto: File | null) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [foto, setFoto] = useState<File | null>(null);

  const form = useForm<CreatePenghapusanInput>({
    resolver: zodResolver(createPenghapusanSchema),
    defaultValues: {
      barangId: barang.id,
      alasan: "",
      sumber: "MANUAL",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSubmit(d, foto))} className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{barang.kodeBarang}</p>
          <p className="font-medium">{barang.namaBarang}</p>
          <p className="text-muted-foreground text-xs mt-1">
            Kondisi: {barang.kondisi.replace("_", " ")}
          </p>
        </div>

        <FormField
          control={form.control}
          name="sumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sumber Penghapusan</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUMBER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
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
          name="alasan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alasan Penghapusan</FormLabel>
              <FormControl>
                <Input placeholder="Minimal 10 karakter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Foto Bukti (opsional)
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />
        </div>

        <DialogFooter>
          <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
            Batal
          </button>
          <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
            {submitting ? "Mengajukan..." : "Ajukan Penghapusan"}
          </button>
        </DialogFooter>
      </form>
    </Form>
  );
}
