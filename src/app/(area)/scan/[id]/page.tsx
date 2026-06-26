"use client";

import { use, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle, QrCode, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { apiClient, ApiClientError, fetchData, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  BaselineBarang,
  OpnameDetail,
  Ruangan,
  StockOpname,
  StatusMatching,
} from "@/types/master";

type ScanFeedback = {
  status: StatusMatching | null;
  kodeBarang: string;
  namaBarang: string | null;
  keterangan: string | null;
};

type AksiTindakLanjut =
  | "PERBAIKI_LOKASI_AKTUAL"
  | "SESUAIKAN_LOKASI_TERDAFTAR"
  | "TANDAI_HILANG"
  | "CATAT_ANOMALI";

type TindakLanjutState = {
  detail: OpnameDetail;
  aksi: AksiTindakLanjut | null;
};

const FEEDBACK_CONFIG: Record<StatusMatching, { icon: typeof CheckCircle; color: string; label: string }> = {
  COCOK: { icon: CheckCircle, color: "text-green-600", label: "Cocok" },
  TIDAK_COCOK: { icon: AlertTriangle, color: "text-yellow-500", label: "Tidak Cocok" },
  TIDAK_TERDAFTAR: { icon: XCircle, color: "text-destructive", label: "Tidak Terdaftar" },
};

const AKSI_OPTIONS: { value: AksiTindakLanjut; label: string; desc: string }[] = [
  { value: "PERBAIKI_LOKASI_AKTUAL", label: "Perbaiki Lokasi Aktual", desc: "Perbarui lokasi aktual barang sesuai lokasi ditemukan" },
  { value: "SESUAIKAN_LOKASI_TERDAFTAR", label: "Sesuaikan Lokasi Terdaftar", desc: "Ubah lokasi terdaftar barang ke ruangan ini" },
  { value: "TANDAI_HILANG", label: "Tandai Hilang", desc: "Ubah status barang menjadi HILANG" },
  { value: "CATAT_ANOMALI", label: "Catat Anomali Saja", desc: "Hanya catat sebagai anomali tanpa mengubah data" },
];

export default function SesiScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [ruanganAktualId, setRuanganAktualId] = useState<string | undefined>();
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [selesaiOpen, setSelesaiOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "baseline" | "hasil">("scan");

  // Tindak lanjut anomali state
  const [tindakLanjut, setTindakLanjut] = useState<TindakLanjutState | null>(null);
  const [selectedAksi, setSelectedAksi] = useState<AksiTindakLanjut | null>(null);
  const [selectedLokasiId, setSelectedLokasiId] = useState<string>("");
  const [tindakLanjutSubmitting, setTindakLanjutSubmitting] = useState(false);

  const scannerRef = useRef<{ stop: () => void } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.scan.detail(id),
    queryFn: () => fetchData<{ sesi: StockOpname; baseline: BaselineBarang[] }>(`/scan/${id}`),
    refetchInterval: (query) => {
      const d = query.state.data as { sesi: StockOpname } | undefined;
      return d?.sesi.status === "AKTIF" ? 5000 : false;
    },
  });

  // Ruangan untuk picker lokasi tindak lanjut
  const needsLokasiPicker =
    selectedAksi === "PERBAIKI_LOKASI_AKTUAL" || selectedAksi === "SESUAIKAN_LOKASI_TERDAFTAR";
  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>(`/master/ruangan?page=0&size=200`),
    enabled: !!tindakLanjut && needsLokasiPicker,
  });

  const sesi = data?.sesi;
  const baseline = data?.baseline ?? [];

  // Ref untuk closure scan — di-set via useEffect sehingga selalu fresh tanpa re-init kamera
  const handleScanRef = useRef<(qrPayload: string) => Promise<void>>(async () => {});
  const ruanganAktualIdRef = useRef(ruanganAktualId);

  useEffect(() => {
    ruanganAktualIdRef.current = ruanganAktualId;
  }, [ruanganAktualId]);

  useEffect(() => {
    handleScanRef.current = async (qrPayload: string) => {
      try {
        type ScanResult =
          | { tipe: "ruangan"; ruanganAktualId: string; kodeRuangan: string; namaRuangan: string }
          | {
              tipe: "barang";
              statusMatching: StatusMatching;
              keterangan: string | null;
              barang: { kodeBarang: string; namaBarang: string } | null;
              detail: OpnameDetail;
            };

        const result = await apiClient.post<{ data: ScanResult }>(`/scan/${id}/scan`, {
          qrPayload,
          ruanganAktualId: ruanganAktualIdRef.current,
        });

        const r = result.data;

        if (r.tipe === "ruangan") {
          setRuanganAktualId(r.ruanganAktualId);
          toast.success(`Ruangan aktual: ${r.kodeRuangan} — ${r.namaRuangan}`);
          return;
        }

        setFeedback({
          status: r.statusMatching,
          kodeBarang: r.barang?.kodeBarang ?? qrPayload.slice(0, 30),
          namaBarang: r.barang?.namaBarang ?? null,
          keterangan: r.keterangan,
        });

        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);

        await queryClient.invalidateQueries({ queryKey: queryKeys.scan.detail(id) });
      } catch (err) {
        toast.error(err instanceof ApiClientError ? err.message : "Gagal memproses scan");
      }
    };
  }, [id, queryClient]);

  // Inisialisasi kamera html5-qrcode
  useEffect(() => {
    if (!sesi || sesi.status !== "AKTIF") return;

    let stopped = false;
    let scanner: { clear: () => Promise<void> } | null = null;

    async function initScanner() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        const s = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );

        s.render(
          async (decodedText: string) => {
            await handleScanRef.current(decodedText);
          },
          () => {
            // scan error sementara — diabaikan
          },
        );

        scanner = s;
        scannerRef.current = { stop: () => { s.clear().catch(() => {}); } };
        if (!stopped) setScannerReady(true);
      } catch (err) {
        if (!stopped) {
          setScannerError("Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan.");
          console.error(err);
        }
      }
    }

    void initScanner();

    return () => {
      stopped = true;
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi?.status]);

  async function handleSelesai() {
    setSubmitting(true);
    try {
      await apiClient.post(`/scan/${id}/selesai`, {});
      toast.success("Sesi scan selesai");
      setSelesaiOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.scan.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal menyelesaikan sesi");
    } finally {
      setSubmitting(false);
    }
  }

  function openTindakLanjut(detail: OpnameDetail) {
    setTindakLanjut({ detail, aksi: null });
    setSelectedAksi(null);
    setSelectedLokasiId("");
  }

  async function handleTindakLanjut() {
    if (!tindakLanjut || !selectedAksi) return;
    setTindakLanjutSubmitting(true);
    try {
      await apiClient.post(`/scan/${id}/tindak-lanjut`, {
        detailId: tindakLanjut.detail.id,
        aksi: selectedAksi,
        ...(needsLokasiPicker && selectedLokasiId ? { lokasiBaruId: selectedLokasiId } : {}),
      });
      toast.success("Tindak lanjut berhasil dicatat");
      setTindakLanjut(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.scan.detail(id) });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal menyimpan tindak lanjut");
    } finally {
      setTindakLanjutSubmitting(false);
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Memuat sesi...</div>;
  if (!sesi) return <EmptyState icon={QrCode} title="Sesi tidak ditemukan" />;

  const detail = sesi.detail ?? [];
  const hasil = detail.filter((d) => d.statusMatching === "COCOK" || d.statusMatching === "TIDAK_COCOK" || d.statusMatching === "TIDAK_TERDAFTAR");
  const anomali = detail.filter((d) => d.statusMatching === "TIDAK_COCOK" || d.statusMatching === "TIDAK_TERDAFTAR");

  const scannedBarangIds = new Set(
    detail.filter((d) => d.barangId && d.statusMatching === "COCOK").map((d) => d.barangId),
  );
  const hilang = baseline.filter((b) => !scannedBarangIds.has(b.id));

  const needsLokasiPickerForDialog =
    selectedAksi === "PERBAIKI_LOKASI_AKTUAL" || selectedAksi === "SESUAIKAN_LOKASI_TERDAFTAR";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/scan">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft />
              <span className="sr-only">Kembali</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">
              Scan #{sesi.nomor} — {sesi.ruangan.namaRuangan}
            </h1>
            <p className="text-sm text-muted-foreground">
              Tahun {sesi.tahunAnggaran} ·{" "}
              <Badge variant={sesi.status === "AKTIF" ? "default" : "secondary"}>
                {sesi.status}
              </Badge>
            </p>
          </div>
        </div>
        {sesi.status === "AKTIF" && (
          <Button variant="destructive" size="sm" onClick={() => setSelesaiOpen(true)}>
            Selesaikan Sesi
          </Button>
        )}
      </div>

      {/* Statistik cepat */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Discan", value: sesi.jumlahBarangScan, color: "text-foreground" },
          { label: "Cocok", value: sesi.jumlahCocok, color: "text-green-600" },
          { label: "Tdk Cocok", value: sesi.jumlahTidakCocok, color: "text-yellow-600" },
          { label: "Hilang", value: sesi.jumlahHilang, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b">
        {(["scan", "baseline", "hasil"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "scan" && "Scanner"}
            {tab === "baseline" && `Baseline (${baseline.length})`}
            {tab === "hasil" && `Hasil Scan (${hasil.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Scanner */}
      {activeTab === "scan" && (
        <div className="space-y-4">
          {sesi.status !== "AKTIF" ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              Sesi sudah selesai. Lihat hasil di tab &quot;Hasil Scan&quot;.
            </div>
          ) : (
            <>
              {ruanganAktualId && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Ruangan aktual: </span>
                  <span className="font-medium">{ruanganAktualId}</span>
                  <span className="text-xs text-muted-foreground ml-2">(scan QR Ruangan untuk ganti)</span>
                </div>
              )}

              {/* Feedback scan */}
              {feedback && feedback.status && (
                <div
                  className={`rounded-lg border-2 p-4 flex items-start gap-3 transition-all ${
                    feedback.status === "COCOK"
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : feedback.status === "TIDAK_COCOK"
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                        : "border-destructive bg-destructive/5"
                  }`}
                >
                  {(() => {
                    const cfg = FEEDBACK_CONFIG[feedback.status];
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className={`size-6 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div>
                          <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                          <p className="text-sm font-mono">{feedback.kodeBarang}</p>
                          {feedback.namaBarang && <p className="text-sm">{feedback.namaBarang}</p>}
                          {feedback.keterangan && (
                            <p className="text-sm mt-1 text-muted-foreground">{feedback.keterangan}</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {scannerError ? (
                <div className="rounded-lg border border-destructive p-6 text-center text-sm text-destructive">
                  {scannerError}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div id="qr-reader" className="w-full" />
                  {!scannerReady && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Memuat kamera...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Baseline */}
      {activeTab === "baseline" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {baseline.length} barang terdaftar di {sesi.ruangan.namaRuangan} (BAS-01). Hijau = sudah discan.
          </p>
          {baseline.length === 0 ? (
            <EmptyState icon={QrCode} title="Tidak ada barang terdaftar di ruangan ini" />
          ) : (
            <div className="space-y-1">
              {baseline.map((b) => {
                const sudahScan = scannedBarangIds.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      sudahScan ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""
                    }`}
                  >
                    {sudahScan ? (
                      <CheckCircle className="size-4 text-green-600 shrink-0" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{b.namaBarang}</p>
                      <p className="text-xs text-muted-foreground font-mono">{b.kodeBarang}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Hasil Scan */}
      {activeTab === "hasil" && (
        <div className="space-y-4">
          {hasil.length === 0 ? (
            <EmptyState icon={QrCode} title="Belum ada barang yang discan" />
          ) : (
            <div className="space-y-2">
              {hasil.map((d) => {
                const cfg = FEEDBACK_CONFIG[d.statusMatching];
                const Icon = cfg.icon;
                const isAnomaali = d.statusMatching !== "COCOK";
                return (
                  <div key={d.id} className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm">
                    <Icon className={`size-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{d.kodeBarangScan}</span>
                        <Badge
                          variant={
                            d.statusMatching === "COCOK"
                              ? "default"
                              : d.statusMatching === "TIDAK_COCOK"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      {d.barang && <p className="text-sm">{d.barang.namaBarang}</p>}
                      {d.keterangan && (
                        <p className="text-xs text-muted-foreground mt-0.5">{d.keterangan}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(d.waktuScan).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isAnomaali && sesi.status === "SELESAI" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTindakLanjut(d)}
                        >
                          Tindak Lanjut
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barang hilang */}
          {sesi.status === "SELESAI" && hilang.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Barang Tidak Discan / Hilang ({hilang.length})
              </p>
              <p className="text-xs text-muted-foreground">
                Barang-barang ini sudah otomatis ditandai HILANG saat sesi selesai (SCN-09).
              </p>
              {hilang.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-destructive/30 px-3 py-2 text-sm"
                >
                  <XCircle className="size-4 text-destructive shrink-0" />
                  <div>
                    <p className="font-medium">{b.namaBarang}</p>
                    <p className="text-xs text-muted-foreground font-mono">{b.kodeBarang}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ringkasan anomali untuk sesi aktif */}
          {sesi.status === "AKTIF" && anomali.length > 0 && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-200">
              {anomali.length} item anomali ditemukan. Selesaikan sesi untuk memproses tindak lanjut.
            </div>
          )}
        </div>
      )}

      {/* Dialog: Selesaikan Sesi */}
      <ConfirmDialog
        open={selesaiOpen}
        onOpenChange={setSelesaiOpen}
        title="Selesaikan Sesi Scan?"
        description="Sesi yang sudah selesai bersifat permanen dan tidak dapat diubah. Barang yang belum discan akan ditandai sebagai hilang."
        confirmLabel="Ya, Selesaikan"
        variant="destructive"
        loading={submitting}
        onConfirm={handleSelesai}
      />

      {/* Dialog: Tindak Lanjut Anomali */}
      <Dialog
        open={!!tindakLanjut}
        onOpenChange={(open) => {
          if (!open) setTindakLanjut(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tindak Lanjut Anomali</DialogTitle>
          </DialogHeader>
          {tindakLanjut && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <p className="font-mono text-xs">{tindakLanjut.detail.kodeBarangScan}</p>
                {tindakLanjut.detail.barang && (
                  <p className="font-medium">{tindakLanjut.detail.barang.namaBarang}</p>
                )}
                <Badge
                  variant={tindakLanjut.detail.statusMatching === "TIDAK_COCOK" ? "secondary" : "destructive"}
                  className="mt-1 text-xs"
                >
                  {FEEDBACK_CONFIG[tindakLanjut.detail.statusMatching]?.label}
                </Badge>
                {tindakLanjut.detail.keterangan && (
                  <p className="text-xs text-muted-foreground mt-1">{tindakLanjut.detail.keterangan}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pilih Aksi</p>
                {AKSI_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedAksi(opt.value);
                      setSelectedLokasiId("");
                    }}
                    className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                      selectedAksi === opt.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {needsLokasiPickerForDialog && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Lokasi Baru</p>
                  <Select value={selectedLokasiId} onValueChange={setSelectedLokasiId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {(ruanganData?.data ?? []).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.kodeRuangan} — {r.namaRuangan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTindakLanjut(null)}
              disabled={tindakLanjutSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleTindakLanjut}
              disabled={
                !selectedAksi ||
                (needsLokasiPickerForDialog && !selectedLokasiId) ||
                tindakLanjutSubmitting
              }
            >
              {tindakLanjutSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
