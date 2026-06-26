"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRightLeft, Clock, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/domain/empty-state";
import { PemindahanDialog } from "@/components/domain/pengajuan/pemindahan-dialog";
import { LaporanKerusakanDialog } from "@/components/domain/pengajuan/laporan-kerusakan-dialog";
import { apiClient, ApiClientError, fetchData, postFormData } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { KONDISI_LABEL, KONDISI_VARIANT, STATUS_BARANG_LABEL, STATUS_BARANG_VARIANT } from "@/lib/barang-constants";
import type { BarangDetail } from "@/types/master";
import type { CreatePemindahanInput, CreateLaporanKerusakanInput } from "@/lib/validation/pengajuan";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-56" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function BarangDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [pemindahanOpen, setPemindahanOpen] = useState(false);
  const [kerusakanOpen, setKerusakanOpen] = useState(false);
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

  if (isLoading) return <DetailSkeleton />;
  if (!data) return <EmptyState icon={Package} title="Barang tidak ditemukan" />;

  const { barang, riwayat } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/barang">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft />
              <span className="sr-only">Kembali</span>
            </Button>
          </Link>
          <div>
            <p className="font-mono text-xs text-muted-foreground">{barang.kodeBarang}</p>
            <h1 className="font-display text-xl font-bold tracking-tight">{barang.namaBarang}</h1>
          </div>
          <Badge variant={KONDISI_VARIANT[barang.kondisi]}>{KONDISI_LABEL[barang.kondisi]}</Badge>
          <Badge variant={STATUS_BARANG_VARIANT[barang.statusBarang]}>{STATUS_BARANG_LABEL[barang.statusBarang]}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPemindahanOpen(true)} disabled={barang.statusBarang === "NONAKTIF"}>
            <ArrowRightLeft className="size-3.5" />
            Pindah
          </Button>
          <Button variant="outline" size="sm" onClick={() => setKerusakanOpen(true)} disabled={barang.statusBarang === "NONAKTIF"}>
            <AlertTriangle className="size-3.5" />
            Lapor Rusak
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Info */}
          <section className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informasi Barang</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Jenis</dt>
                <dd>{barang.jenis.nama} <span className="text-muted-foreground">({barang.jenis.kode})</span></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Tahun Pembelian</dt>
                <dd className="tabular-nums">{barang.tahunPembelian}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Penguasaan</dt>
                <dd>{barang.penguasaan}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Kategori Approval</dt>
                <dd className="flex items-center gap-1.5">
                  {barang.kategoriApproval.nama}
                  {barang.kategoriApproval.wajibApproval && (
                    <Badge variant="secondary" className="text-[10px]">Wajib</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Lokasi */}
          <section className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lokasi</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Lokasi Terdaftar</dt>
                <dd>
                  <span className="font-mono text-xs">{barang.lokasiTerdaftar.kodeRuangan}</span>{" "}
                  {barang.lokasiTerdaftar.namaRuangan}
                  <span className="text-muted-foreground text-xs block">{barang.lokasiTerdaftar.gedung.nama}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground mb-0.5">Lokasi Aktual</dt>
                <dd className="flex items-start gap-1.5">
                  <span>
                    <span className="font-mono text-xs">{barang.lokasiAktual.kodeRuangan}</span>{" "}
                    {barang.lokasiAktual.namaRuangan}
                  </span>
                  {barang.lokasiAktual.id !== barang.lokasiTerdaftar.id && (
                    <Badge variant="destructive" className="text-[10px] shrink-0">Berbeda</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Timeline */}
          {riwayat.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Riwayat</h3>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
                {riwayat.map((r) => (
                  <div key={r.id} className="relative flex gap-3 text-sm">
                    <div className="absolute -left-4 top-1 flex size-4 items-center justify-center rounded-full border bg-card">
                      <Clock className="size-2.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(r.waktu).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <p className="mt-0.5">{r.aktivitas}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar — Foto & QR */}
        <div className="space-y-4">
          {barang.fotoPath && (
            <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Foto</h3>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                <Image src={`/api/barang/${barang.id}/foto`} alt={barang.namaBarang} fill className="object-cover" />
              </div>
            </section>
          )}

          {qrData && (
            <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">QR Code</h3>
              <div className="flex justify-center rounded-xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData.dataUrl} alt="QR Code" className="size-44" />
              </div>
              <p className="text-xs text-muted-foreground text-center font-mono">{barang.kodeBarang}</p>
            </section>
          )}
        </div>
      </div>

      <PemindahanDialog barang={barang} open={pemindahanOpen} onOpenChange={setPemindahanOpen} onSubmit={handlePemindahan} submitting={submitting} />
      <LaporanKerusakanDialog barang={barang} open={kerusakanOpen} onOpenChange={setKerusakanOpen} onSubmit={handleKerusakan} submitting={submitting} />
    </div>
  );
}
