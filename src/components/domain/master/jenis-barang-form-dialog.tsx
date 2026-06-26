"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { createJenisBarangSchema, type CreateJenisBarangInput } from "@/lib/validation/jenis-barang";
import type { JenisBarang } from "@/types/master";

interface JenisBarangFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jenisBarang?: JenisBarang | null;
  onSubmit: (values: CreateJenisBarangInput) => Promise<void>;
  submitting?: boolean;
}

export function JenisBarangFormDialog({
  open,
  onOpenChange,
  jenisBarang,
  onSubmit,
  submitting,
}: JenisBarangFormDialogProps) {
  const form = useForm<CreateJenisBarangInput>({
    resolver: zodResolver(createJenisBarangSchema),
    defaultValues: { kode: "", nama: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ kode: jenisBarang?.kode ?? "", nama: jenisBarang?.nama ?? "" });
    }
  }, [open, jenisBarang, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{jenisBarang ? "Ubah Jenis Barang" : "Tambah Jenis Barang"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: MEJA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Meja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <button type="button" onClick={() => onOpenChange(false)} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
