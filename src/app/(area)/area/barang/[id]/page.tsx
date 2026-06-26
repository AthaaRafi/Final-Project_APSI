"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRightLeft, Package, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { PemindahanDialog } from "@/components/domain/pengajuan/pemindahan-dialog";
import { LaporanKerusakanDialog } from "@/components/domain/pengajuan/laporan-kerusakan-dialog";
import { PenghapusanDialog } from "@/components/domain/pengajuan/penghapusan-dialog";
import { apiClient, ApiClientError, fetchData, postFormData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT, STATUS_BARANG_LABEL, STATUS_BARANG_VARIANT } from "@/lib/barang-constants";
import type { BarangDetail } from "@/types/master";
import type { CreatePemindahanInput, CreateLaporanKerusakanInput, CreatePenghapusanInput } from "@/lib/validation/pengajuan";

export default function BarangDetailAreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [pemindahanOpen, setPemindahanOpen] = useState(false);
  const [kerusakanOpen, setKerusakanOpen] = useState(false);
  const [penghapusanOpen, setPenghapusanOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.barang.detail(id),
    queryFn: () => fetchData<BarangDetail>(`/barang/${id}`),
  });

  const { data: qrData } = useQuery({
    queryKey: queryKeys.barang.qr(id),
    queryFn: () => fetchData<{ qrId: string; dataUrl: string }>(`/barang/${id}/qr`),
    enabled: !!data?.barang,
  });

  async function handlePemindahan(input: CreatePemindahanInput) {
    setSubmitting(true);
    try {
      await apiClient.post("/pengajuan/pemindahan", input);
      toast.success("Pengajuan pemindahan berhasil dibuat");
      setPemindahanOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.barang.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal mengajukan pemindahan");
    } finally {
      setSubmitting(false);
    }
  }

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
      toast.success("Laporan kerusakan berhasil dibuat");
      setKerusakanOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.barang.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal membuat laporan kerusakan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePenghapusan(input: CreatePenghapusanInput, foto: File | null) {
    setSubmitting(true);
    try {
      if (foto) {
        const fd = new FormData();
        fd.append("barangId", input.barangId);
        fd.append("alasan", input.alasan);
        fd.append("sumber", input.sumber);
        if (input.sumberRefId) fd.append("sumberRefId", input.sumberRefId);
        fd.append("foto", foto);
        await postFormData("/pengajuan/penghapusan", fd);
      } else {
        await apiClient.post("/pengajuan/penghapusan", input);
      }
      toast.success("Usulan penghapusan berhasil diajukan");
      setPenghapusanOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.barang.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal mengajukan penghapusan");
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

  const { barang, riwayat } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/area/barang">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPemindahanOpen(true)}
            disabled={barang.statusBarang === "NONAKTIF"}
          >
            <ArrowRightLeft className="size-4 mr-1" />
            Pindah
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKerusakanOpen(true)}
            disabled={barang.statusBarang === "NONAKTIF"}
          >
            <AlertTriangle className="size-4 mr-1" />
            Lapor Rusak
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPenghapusanOpen(true)}
            disabled={barang.statusBarang === "NONAKTIF" || barang.statusBarang === "DIAJUKAN_HAPUS"}
          >
            <Trash2 className="size-4 mr-1" />
            Usul Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Informasi Barang</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Jenis</dt>
                <dd>{barang.jenis.nama} ({barang.jenis.kode})</dd>
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
                <dt className="text-muted-foreground">Penguasaan</dt>
                <dd>{barang.penguasaan}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Lokasi</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Lokasi Terdaftar</dt>
                <dd>
                  <span className="font-mono">{barang.lokasiTerdaftar.kodeRuangan}</span>{" "}
                  {barang.lokasiTerdaftar.namaRuangan}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lokasi Aktual</dt>
                <dd>
                  <span className="font-mono">{barang.lokasiAktual.kodeRuangan}</span>{" "}
                  {barang.lokasiAktual.namaRuangan}
                  {barang.lokasiAktual.id !== barang.lokasiTerdaftar.id && (
                    <Badge variant="destructive" className="ml-2 text-xs">Berbeda</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {riwayat.length > 0 && (
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Riwayat</h3>
              <ul className="space-y-2">
                {riwayat.map((r) => (
                  <li key={r.id} className="text-sm flex gap-3">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.waktu).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span>{r.aktivitas}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {barang.fotoPath && (
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
          )}

          {qrData && (
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">QR Code</h3>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData.dataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-muted-foreground text-center font-mono">{barang.kodeBarang}</p>
            </section>
          )}
        </div>
      </div>

      <PemindahanDialog
        barang={barang}
        open={pemindahanOpen}
        onOpenChange={setPemindahanOpen}
        onSubmit={handlePemindahan}
        submitting={submitting}
      />
      <LaporanKerusakanDialog
        barang={barang}
        open={kerusakanOpen}
        onOpenChange={setKerusakanOpen}
        onSubmit={handleKerusakan}
        submitting={submitting}
      />
      <PenghapusanDialog
        barang={barang}
        open={penghapusanOpen}
        onOpenChange={setPenghapusanOpen}
        onSubmit={handlePenghapusan}
        submitting={submitting}
      />
    </div>
  );
}
