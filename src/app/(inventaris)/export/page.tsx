"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Ruangan, JenisBarang } from "@/types/master";
import { KONDISI_LABEL, STATUS_BARANG_LABEL } from "@/lib/barang-constants";

export default function ExportPage() {
  const [ruanganId, setRuanganId] = useState<string>("");
  const [jenisId, setJenisId] = useState<string>("");
  const [kondisi, setKondisi] = useState<string>("");
  const [statusBarang, setStatusBarang] = useState<string>("");
  const [tahunMin, setTahunMin] = useState<string>("");
  const [tahunMax, setTahunMax] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 200),
    queryFn: () => fetchPaginated<Ruangan>("/master/ruangan?page=0&size=200"),
  });

  const { data: jenisData } = useQuery({
    queryKey: queryKeys.master.jenisBarang(0, 100),
    queryFn: () => fetchPaginated<JenisBarang>("/master/jenis-barang?page=0&size=100"),
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (ruanganId) params.set("ruanganId", ruanganId);
      if (jenisId) params.set("jenisId", jenisId);
      if (kondisi) params.set("kondisi", kondisi);
      if (statusBarang) params.set("statusBarang", statusBarang);
      if (tahunMin) params.set("tahunMin", tahunMin);
      if (tahunMax) params.set("tahunMax", tahunMax);

      const res = await fetch(`/api/export/barang?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json() as { detail?: string };
        throw new Error(json.detail ?? "Gagal mengunduh");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      a.download = filenameMatch?.[1] ?? "inventaris.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File Excel berhasil diunduh");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh");
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    setRuanganId("");
    setJenisId("");
    setKondisi("");
    setStatusBarang("");
    setTahunMin("");
    setTahunMax("");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FileSpreadsheet className="size-5" />
          Export Data Inventaris
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unduh data barang sebagai file Excel (.xlsx) untuk keperluan pelaporan ke universitas.
          Export bersifat manual — tidak ada pengiriman otomatis (KP-19/EXP-01).
        </p>
      </div>

      <div className="space-y-4">
        {/* Filter Ruangan */}
        <div className="space-y-1.5">
          <Label>Ruangan (opsional)</Label>
          <Select value={ruanganId || "all-ruangan"} onValueChange={(v) => setRuanganId(v === "all-ruangan" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua ruangan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-ruangan">Semua ruangan</SelectItem>
              {(ruanganData?.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.kodeRuangan} — {r.namaRuangan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Jenis */}
        <div className="space-y-1.5">
          <Label>Jenis Barang (opsional)</Label>
          <Select value={jenisId || "all-jenis"} onValueChange={(v) => setJenisId(v === "all-jenis" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-jenis">Semua jenis</SelectItem>
              {(jenisData?.data ?? []).map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Kondisi */}
        <div className="space-y-1.5">
          <Label>Kondisi (opsional)</Label>
          <Select value={kondisi || "all-kondisi"} onValueChange={(v) => setKondisi(v === "all-kondisi" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-kondisi">Semua kondisi</SelectItem>
              {Object.entries(KONDISI_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Status */}
        <div className="space-y-1.5">
          <Label>Status Barang (opsional)</Label>
          <Select value={statusBarang || "all-status"} onValueChange={(v) => setStatusBarang(v === "all-status" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">Semua status</SelectItem>
              {Object.entries(STATUS_BARANG_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Tahun Pembelian */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tahun Pembelian (dari)</Label>
            <Input
              type="number"
              min="2000"
              max="2100"
              placeholder="mis. 2020"
              value={tahunMin}
              onChange={(e) => setTahunMin(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tahun Pembelian (sampai)</Label>
            <Input
              type="number"
              min="2000"
              max="2100"
              placeholder="mis. 2025"
              value={tahunMax}
              onChange={(e) => setTahunMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="size-4 mr-1" />
          {downloading ? "Mengunduh..." : "Unduh Excel (.xlsx)"}
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={downloading}>
          Reset Filter
        </Button>
      </div>
    </div>
  );
}
