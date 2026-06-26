"use client";

import { useState } from "react";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createBarangSchema, type CreateBarangInput } from "@/lib/validation/barang";
import type { JenisBarang, KategoriApproval, Ruangan } from "@/types/master";

interface BarangFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruanganList: Ruangan[];
  jenisList: JenisBarang[];
  kategoriList: KategoriApproval[];
  onSubmit: (data: CreateBarangInput, foto: File) => Promise<void>;
  submitting?: boolean;
}

const KONDISI_OPTIONS = [
  { value: "BAIK", label: "Baik" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_BERAT", label: "Rusak Berat" },
] as const;

export function BarangFormDialog({
  open,
  onOpenChange,
  ruanganList,
  jenisList,
  kategoriList,
  onSubmit,
  submitting,
}: BarangFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Barang</DialogTitle>
        </DialogHeader>
        {open && (
          <BarangForm
            key="new"
            ruanganList={ruanganList}
            jenisList={jenisList}
            kategoriList={kategoriList}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BarangForm({
  ruanganList,
  jenisList,
  kategoriList,
  onSubmit,
  onCancel,
  submitting,
}: {
  ruanganList: Ruangan[];
  jenisList: JenisBarang[];
  kategoriList: KategoriApproval[];
  onSubmit: (data: CreateBarangInput, foto: File) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoError, setFotoError] = useState<string>("");

  const form = useForm<CreateBarangInput>({
    resolver: zodResolver(createBarangSchema),
    defaultValues: {
      namaBarang: "",
      jenisId: "",
      kategoriApprovalId: "",
      tahunPembelian: new Date().getFullYear(),
      lokasiTerdaftarId: "",
      kondisi: "BAIK",
      penguasaan: "",
      kodeBarang: undefined,
    },
  });

  async function handleSubmit(data: CreateBarangInput) {
    if (!foto) {
      setFotoError("Foto wajib diupload");
      return;
    }
    setFotoError("");
    await onSubmit(data, foto);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="namaBarang"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Barang</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Meja Kerja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="jenisId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Barang</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jenisList.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.kode} - {j.nama}
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
            name="kategoriApprovalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori Approval</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {kategoriList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="tahunPembelian"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tahun Pembelian</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kondisi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kondisi</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KONDISI_OPTIONS.map((o) => (
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
        </div>

        <FormField
          control={form.control}
          name="lokasiTerdaftarId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokasi Terdaftar</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ruanganList.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.kodeRuangan} - {r.namaRuangan}
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
          name="penguasaan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Penguasaan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Prodi Informatika" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kodeBarang"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Barang (opsional — kosongkan untuk auto-generate)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: MEJA-2025-R201-0001"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Foto Barang <span className="text-destructive">*</span>
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setFoto(e.target.files?.[0] ?? null);
              setFotoError("");
            }}
          />
          {fotoError && <p className="text-sm text-destructive">{fotoError}</p>}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </DialogFooter>
      </form>
    </Form>
  );
}
