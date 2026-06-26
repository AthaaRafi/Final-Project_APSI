"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/domain/empty-state";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { BarangForLabel, KonfigurasiLabel, Ruangan } from "@/types/master";

interface LabelItem {
  kodeBarang: string;
  namaBarang: string;
  qrDataUrl: string;
}

export default function CetakLabelPage() {
  const [ruanganId, setRuanganId] = useState<string>("");
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>("/master/ruangan?page=0&size=200"),
  });

  const { data: config } = useQuery({
    queryKey: queryKeys.label.config(),
    queryFn: async () => {
      const res = await fetch("/api/label/config", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json() as { data: KonfigurasiLabel | null };
      return json.data;
    },
  });

  const { data: logoDataUrl = "" } = useQuery({
    queryKey: ["label", "logo", config?.logoPath ?? ""],
    queryFn: async () => {
      if (!config?.logoPath) return "";
      const res = await fetch(`/api/file/${config.logoPath}`, { credentials: "include" });
      if (!res.ok) return "";
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(blob);
      });
    },
    enabled: !!config?.logoPath,
  });

  const { data: barangList, isFetching: isFetchingBarang } = useQuery({
    queryKey: queryKeys.label.barang(ruanganId),
    queryFn: async () => {
      const res = await fetch(`/api/label/barang?ruanganId=${ruanganId}`, { credentials: "include" });
      if (!res.ok) return [] as BarangForLabel[];
      const json = await res.json() as { data: BarangForLabel[] };
      return json.data;
    },
    enabled: !!ruanganId,
  });

  const { data: labelItems = [], isFetching: isGenerating } = useQuery({
    queryKey: ["label", "qr-items", ruanganId, barangList?.map((b) => b.id).join(",") ?? ""],
    queryFn: async () => {
      if (!barangList?.length) return [] as LabelItem[];
      const QRCode = (await import("qrcode")).default;
      return Promise.all(
        barangList.map(async (barang) => {
          const payload = barang.qr[0]?.payload ?? JSON.stringify({
            v: 1, t: "barang", id_barang: barang.id,
            kode_barang: barang.kodeBarang, nama_barang: barang.namaBarang,
          });
          const qrDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 200,
          });
          return { kodeBarang: barang.kodeBarang, namaBarang: barang.namaBarang, qrDataUrl };
        }),
      );
    },
    enabled: !!ruanganId && !!barangList?.length,
  });

  const kolom = config?.layoutKolom ?? 2;

  async function handlePrint() {
    if (labelItems.length === 0) return;
    setPrinting(true);
    try {
      window.print();
      await apiClient.post("/label/cetak", {
        ruanganId,
        jumlahLabel: labelItems.length,
      });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal mencatat log cetak");
    } finally {
      setPrinting(false);
    }
  }

  const selectedRuangan = ruanganData?.data.find((r) => r.id === ruanganId);

  return (
    <>
      <style>{`
        @media screen {
          #label-print-area { display: none !important; }
        }
        @media print {
          body * { visibility: hidden; height: 0; overflow: hidden; margin: 0; padding: 0; }
          #label-print-area,
          #label-print-area * {
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
          }
          #label-print-area {
            display: block !important;
            position: fixed !important;
            left: 0;
            top: 0;
            width: 100%;
            z-index: 99999;
          }
          #label-print-area > div {
            display: grid !important;
          }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold">Cetak Label Barang</h1>
            <p className="text-sm text-muted-foreground">
              Generate dan cetak label QR untuk barang per ruangan (LBL-01..07)
            </p>
          </div>
          <Button
            onClick={handlePrint}
            disabled={labelItems.length === 0 || printing || isGenerating}
          >
            <Printer className="size-4 mr-1" />
            {printing ? "Memproses..." : `Cetak ${labelItems.length > 0 ? `(${labelItems.length})` : ""}`}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium whitespace-nowrap">Ruangan</label>
          <Select value={ruanganId} onValueChange={(v) => setRuanganId(v)}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Pilih ruangan..." />
            </SelectTrigger>
            <SelectContent>
              {(ruanganData?.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.kodeRuangan} — {r.namaRuangan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isFetchingBarang && (
            <span className="text-xs text-muted-foreground">Memuat barang...</span>
          )}
          {isGenerating && (
            <span className="text-xs text-muted-foreground">Membuat QR code...</span>
          )}
        </div>

        {!ruanganId ? (
          <EmptyState icon={Tag} title="Pilih ruangan" description="Pilih ruangan untuk melihat preview label." />
        ) : labelItems.length === 0 && !isFetchingBarang && !isGenerating ? (
          <EmptyState icon={Tag} title="Tidak ada barang" description="Ruangan ini belum memiliki barang terdaftar." />
        ) : (
          <div ref={printRef}>
            <p className="text-xs text-muted-foreground mb-3 print:hidden">
              Preview label — akan dicetak {labelItems.length} label, {kolom} kolom per baris
            </p>

            <div
              className="grid gap-2 print:hidden"
              style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))` }}
            >
              {labelItems.map((item) => (
                <LabelCard
                  key={item.kodeBarang}
                  item={item}
                  logoDataUrl={logoDataUrl}
                  instituteName={selectedRuangan?.namaRuangan}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div id="label-print-area">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${kolom}, 1fr)`,
            gap: "4mm",
          }}
        >
          {labelItems.map((item, i) => (
            <PrintLabel key={i} item={item} logoDataUrl={logoDataUrl} />
          ))}
        </div>
      </div>
    </>
  );
}

function LabelCard({
  item,
  logoDataUrl,
  instituteName,
}: {
  item: LabelItem;
  logoDataUrl: string;
  instituteName?: string;
}) {
  return (
    <div
      className="border rounded p-2 flex items-center gap-2 bg-white"
      style={{ minHeight: "60px", maxWidth: "240px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.qrDataUrl} alt="QR" className="shrink-0" style={{ width: 52, height: 52 }} />

      <div className="overflow-hidden flex-1">
        {logoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDataUrl} alt="logo" className="h-4 mb-0.5 object-contain" />
        )}
        <p className="font-mono font-bold text-[9px] leading-tight truncate">{item.kodeBarang}</p>
        <p
          className="text-[8px] leading-tight text-gray-700"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.namaBarang}
        </p>
        {instituteName && (
          <p className="text-[7px] leading-tight text-gray-400 truncate mt-0.5">{instituteName}</p>
        )}
      </div>
    </div>
  );
}

function PrintLabel({ item, logoDataUrl }: { item: LabelItem; logoDataUrl: string }) {
  const kode = item.kodeBarang.length > 22
    ? item.kodeBarang.slice(0, 19) + "..."
    : item.kodeBarang;
  const nama = item.namaBarang.length > 38
    ? item.namaBarang.slice(0, 35) + "..."
    : item.namaBarang;

  return (
    <div
      style={{
        width: "60mm",
        height: "25mm",
        border: "0.3mm solid #999",
        display: "flex",
        alignItems: "center",
        padding: "2mm",
        gap: "2mm",
        pageBreakInside: "avoid",
        backgroundColor: "white",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: "0.5mm", left: "0.5mm", width: "2mm", height: "0.3mm", background: "#ccc" }} />
      <div style={{ position: "absolute", top: "0.5mm", left: "0.5mm", width: "0.3mm", height: "2mm", background: "#ccc" }} />
      <div style={{ position: "absolute", top: "0.5mm", right: "0.5mm", width: "2mm", height: "0.3mm", background: "#ccc" }} />
      <div style={{ position: "absolute", top: "0.5mm", right: "0.5mm", width: "0.3mm", height: "2mm", background: "#ccc" }} />
      <div style={{ position: "absolute", bottom: "0.5mm", left: "0.5mm", width: "2mm", height: "0.3mm", background: "#ccc" }} />
      <div style={{ position: "absolute", bottom: "0.5mm", left: "0.5mm", width: "0.3mm", height: "2mm", background: "#ccc" }} />
      <div style={{ position: "absolute", bottom: "0.5mm", right: "0.5mm", width: "2mm", height: "0.3mm", background: "#ccc" }} />
      <div style={{ position: "absolute", bottom: "0.5mm", right: "0.5mm", width: "0.3mm", height: "2mm", background: "#ccc" }} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.qrDataUrl}
        alt="QR"
        style={{ width: "20mm", height: "20mm", flexShrink: 0 }}
      />

      <div style={{ flex: 1, overflow: "hidden" }}>
        {logoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoDataUrl}
            alt="logo"
            style={{ height: "5mm", marginBottom: "1mm", objectFit: "contain" }}
          />
        )}
        <div style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", fontSize: "7pt", lineHeight: 1.2 }}>
          {kode}
        </div>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: "5.5pt", lineHeight: 1.3, color: "#333", marginTop: "0.5mm" }}>
          {nama}
        </div>
      </div>
    </div>
  );
}
