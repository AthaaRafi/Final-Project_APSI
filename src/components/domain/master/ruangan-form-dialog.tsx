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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRuanganSchema, type CreateRuanganInput } from "@/lib/validation/ruangan";
import type { Gedung, Ruangan } from "@/types/master";

interface RuanganFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruangan?: Ruangan | null;
  gedungList: Gedung[];
  onSubmit: (values: CreateRuanganInput) => Promise<void>;
  submitting?: boolean;
}

export function RuanganFormDialog({
  open,
  onOpenChange,
  ruangan,
  gedungList,
  onSubmit,
  submitting,
}: RuanganFormDialogProps) {
  const form = useForm<CreateRuanganInput>({
    resolver: zodResolver(createRuanganSchema),
    defaultValues: {
      kodeRuangan: "",
      namaRuangan: "",
      gedungId: "",
      tipe: "KELAS",
      lantai: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        kodeRuangan: ruangan?.kodeRuangan ?? "",
        namaRuangan: ruangan?.namaRuangan ?? "",
        gedungId: ruangan?.gedungId ?? "",
        tipe: ruangan?.tipe ?? "KELAS",
        lantai: ruangan?.lantai ?? undefined,
      });
    }
  }, [open, ruangan, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ruangan ? "Ubah Ruangan" : "Tambah Ruangan"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kodeRuangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Ruangan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: R201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="namaRuangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Ruangan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Ruang Kelas 201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gedungId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gedung</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih gedung" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gedungList.map((gedung) => (
                        <SelectItem key={gedung.id} value={gedung.id}>
                          {gedung.kode} - {gedung.nama}
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
              name="tipe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="KELAS">Kelas</SelectItem>
                      <SelectItem value="LABORATORIUM">Laboratorium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lantai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lantai</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Opsional"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
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
