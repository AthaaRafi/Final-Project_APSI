"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ApiClientError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { KonfigurasiLabel } from "@/types/master";

interface LabelConfigForm {
  ukuranPanjang: string;
  ukuranLebar: string;
  jumlahPerA4: string;
  layoutKolom: string;
}

export default function KonfigurasiLabelPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoObjectUrl, setLogoObjectUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: queryKeys.label.config(),
    queryFn: async () => {
      const res = await fetch("/api/label/config", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json() as { data: KonfigurasiLabel | null };
      return json.data;
    },
  });

  const form = useForm<LabelConfigForm>({
    values: {
      ukuranPanjang: String(config?.ukuranPanjang ?? 6),
      ukuranLebar: String(config?.ukuranLebar ?? 2.5),
      jumlahPerA4: String(config?.jumlahPerA4 ?? 10),
      layoutKolom: String(config?.layoutKolom ?? 2),
    },
  });

  const logoPreview = logoObjectUrl
    ? logoObjectUrl
    : config?.logoPath
      ? `/api/file/${config.logoPath}`
      : "";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    setLogoFile(file);
    setLogoObjectUrl(URL.createObjectURL(file));
  }

  async function handleSave(values: LabelConfigForm) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("ukuranPanjang", values.ukuranPanjang);
      fd.append("ukuranLebar", values.ukuranLebar);
      fd.append("jumlahPerA4", values.jumlahPerA4);
      fd.append("layoutKolom", values.layoutKolom);
      if (logoFile) fd.append("logo", logoFile);

      const res = await fetch("/api/label/config", {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json() as { detail?: string; title?: string };
        throw new Error(json.detail ?? json.title ?? "Gagal menyimpan");
      }

      toast.success("Konfigurasi label tersimpan");
      setLogoFile(null);
      if (logoObjectUrl) { URL.revokeObjectURL(logoObjectUrl); setLogoObjectUrl(""); }
      await queryClient.invalidateQueries({ queryKey: queryKeys.label.config() });
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message
        : err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Memuat konfigurasi...</div>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="size-5" />
          Konfigurasi Label
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atur ukuran, tata letak, dan logo instansi untuk cetak label barang (LBL-05).
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ukuranPanjang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panjang label (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="3" max="12" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Default: 6 cm</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ukuranLebar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lebar label (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="1.5" max="6" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Default: 2.5 cm</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jumlahPerA4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah per A4</FormLabel>
                  <FormControl>
                    <Input type="number" min="4" max="30" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Default: 10</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="layoutKolom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kolom per baris</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="4" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Default: 2</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo Instansi (LBL-05)</Label>
            {logoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-12 object-contain border rounded p-1 bg-white"
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5 mr-1" />
                {config?.logoPath ? "Ganti Logo" : "Upload Logo"}
              </Button>
              {logoFile && (
                <span className="text-xs text-muted-foreground">{logoFile.name}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground">PNG/JPG/WebP, maks. 1 MB</p>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Konfigurasi"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
