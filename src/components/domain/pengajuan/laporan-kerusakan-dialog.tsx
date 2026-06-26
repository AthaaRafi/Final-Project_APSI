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
import { createLaporanKerusakanSchema, type CreateLaporanKerusakanInput } from "@/lib/validation/pengajuan";
import type { Barang } from "@/types/master";

interface LaporanKerusakanDialogProps {
  barang: Barang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLaporanKerusakanInput, foto: File | null) => Promise<void>;
  submitting?: boolean;
}

export function LaporanKerusakanDialog({
  barang,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: LaporanKerusakanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lapor Kerusakan</DialogTitle>
        </DialogHeader>
        {open && (
          <LaporanKerusakanForm
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

function LaporanKerusakanForm({
  barang,
  onSubmit,
  onCancel,
  submitting,
}: {
  barang: Barang;
  onSubmit: (data: CreateLaporanKerusakanInput, foto: File | null) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [foto, setFoto] = useState<File | null>(null);

  const form = useForm<CreateLaporanKerusakanInput>({
    resolver: zodResolver(createLaporanKerusakanSchema),
    defaultValues: {
      barangId: barang.id,
      alasan: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => onSubmit(d, foto))} className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{barang.kodeBarang}</p>
          <p className="font-medium">{barang.namaBarang}</p>
        </div>

        <FormField
          control={form.control}
          name="alasan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Kerusakan</FormLabel>
              <FormControl>
                <Input placeholder="Minimal 10 karakter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Foto Bukti Kerusakan (opsional)
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
          <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
            {submitting ? "Melaporkan..." : "Lapor"}
          </button>
        </DialogFooter>
      </form>
    </Form>
  );
}
