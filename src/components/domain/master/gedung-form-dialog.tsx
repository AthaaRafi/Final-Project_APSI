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
import { createGedungSchema, type CreateGedungInput } from "@/lib/validation/gedung";
import type { Gedung } from "@/types/master";

interface GedungFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gedung?: Gedung | null;
  onSubmit: (values: CreateGedungInput) => Promise<void>;
  submitting?: boolean;
}

export function GedungFormDialog({
  open,
  onOpenChange,
  gedung,
  onSubmit,
  submitting,
}: GedungFormDialogProps) {
  const form = useForm<CreateGedungInput>({
    resolver: zodResolver(createGedungSchema),
    defaultValues: { kode: "", nama: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ kode: gedung?.kode ?? "", nama: gedung?.nama ?? "" });
    }
  }, [open, gedung, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gedung ? "Ubah Gedung" : "Tambah Gedung"}</DialogTitle>
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
                    <Input placeholder="Contoh: GD-A" {...field} />
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
                    <Input placeholder="Contoh: Gedung A" {...field} />
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
