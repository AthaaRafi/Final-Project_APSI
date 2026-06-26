"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox } from "@/components/ui/checkbox";
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
  createKategoriApprovalSchema,
  type CreateKategoriApprovalInput,
} from "@/lib/validation/kategori-approval";
import type { KategoriApproval } from "@/types/master";

interface KategoriApprovalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kategori?: KategoriApproval | null;
  onSubmit: (values: CreateKategoriApprovalInput) => Promise<void>;
  submitting?: boolean;
}

export function KategoriApprovalFormDialog({
  open,
  onOpenChange,
  kategori,
  onSubmit,
  submitting,
}: KategoriApprovalFormDialogProps) {
  const form = useForm<CreateKategoriApprovalInput>({
    resolver: zodResolver(createKategoriApprovalSchema),
    defaultValues: { nama: "", wajibApproval: false, deskripsi: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nama: kategori?.nama ?? "",
        wajibApproval: kategori?.wajibApproval ?? false,
        deskripsi: kategori?.deskripsi ?? "",
      });
    }
  }, [open, kategori, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kategori ? "Ubah Kategori Approval" : "Tambah Kategori Approval"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Elektronik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input placeholder="Opsional" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wajibApproval"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Wajib approval saat pemindahan antar ruangan</FormLabel>
                  </label>
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
