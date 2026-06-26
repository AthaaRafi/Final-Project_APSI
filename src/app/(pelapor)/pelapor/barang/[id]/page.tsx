"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { LaporanKerusakanDialog } from "@/components/domain/pengajuan/laporan-kerusakan-dialog";
import { apiClient, ApiClientError, fetchData, postFormData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT, STATUS_BARANG_LABEL, STATUS_BARANG_VARIANT } from "@/lib/barang-constants";
import type { BarangDetail } from "@/types/master";
import type { CreateLaporanKerusakanInput } from "@/lib/validation/pengajuan";

export default function BarangDetailPelaporPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [kerusakanOpen, setKerusakanOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.barang.detail(id),
    queryFn: () => fetchData<BarangDetail>(`/barang/${id}`),
  });

  async function handleKerusakan(input: CreateLaporanKerusakanInput, foto: File | null) {
    setSubmitting(true);
    try {
      if (foto) {
        const fd = new FormData();
        fd.append("barangId", input.barangId);
        fd.append("alasan", input.alasan);
        fd.append("foto", foto);
        await postFormData("/pengajuan/kerusakan", fd);
      } else {
        await apiClient.post("/pengajuan/kerusakan", input);
      }
      toast.success("Laporan kerusakan berhasil dikirim");
      setKerusakanOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.barang.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  if (!data) {
    return <EmptyState icon={Package} title="Barang tidak ditemukan" />;
  }

  const { barang } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/pelapor/barang">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft />
              <span className="sr-only">Kembali</span>
            </Button>
          </Link>
          <div>
            <h1 className="font-mono text-sm text-muted-foreground">{barang.kodeBarang}</h1>
            <h2 className="text-lg font-semibold">{barang.namaBarang}</h2>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setKerusakanOpen(true)}
          disabled={barang.statusBarang === "NONAKTIF"}
        >
          <AlertTriangle className="size-4 mr-1" />
          Lapor Rusak
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informasi Barang</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Jenis</dt>
                <dd>{barang.jenis.nama}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tahun Pembelian</dt>
                <dd>{barang.tahunPembelian}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kondisi</dt>
                <dd>
                  <Badge variant={KONDISI_VARIANT[barang.kondisi]}>
                    {KONDISI_LABEL[barang.kondisi]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={STATUS_BARANG_VARIANT[barang.statusBarang]}>
                    {STATUS_BARANG_LABEL[barang.statusBarang]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lokasi</dt>
                <dd>{barang.lokasiTerdaftar.kodeRuangan} — {barang.lokasiTerdaftar.namaRuangan}</dd>
              </div>
            </dl>
          </section>
        </div>

        {barang.fotoPath && (
          <div>
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Foto</h3>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={`/api/barang/${barang.id}/foto`}
                  alt={barang.namaBarang}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          </div>
        )}
      </div>

      <LaporanKerusakanDialog
        barang={barang}
        open={kerusakanOpen}
        onOpenChange={setKerusakanOpen}
        onSubmit={handleKerusakan}
        submitting={submitting}
      />
    </div>
  );
}
