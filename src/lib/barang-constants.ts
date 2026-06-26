import type { Kondisi, StatusBarang } from "@/types/master";

export const KONDISI_LABEL: Record<Kondisi, string> = {
  BAIK: "Baik",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_BERAT: "Rusak Berat",
};

export const KONDISI_VARIANT: Record<Kondisi, "default" | "secondary" | "destructive"> = {
  BAIK: "default",
  RUSAK_RINGAN: "secondary",
  RUSAK_BERAT: "destructive",
};

export const STATUS_BARANG_LABEL: Record<StatusBarang, string> = {
  NORMAL: "Normal",
  DILAPORKAN_RUSAK: "Dilaporkan Rusak",
  MENUNGGU_VALIDASI: "Menunggu Validasi",
  DALAM_PERAWATAN: "Dalam Perawatan",
  TERJADWAL_PERAWATAN: "Terjadwal Perawatan",
  HILANG: "Hilang",
  DIAJUKAN_HAPUS: "Diajukan Hapus",
  NONAKTIF: "Nonaktif",
};

export const STATUS_BARANG_VARIANT: Record<StatusBarang, "default" | "secondary" | "destructive" | "outline"> = {
  NORMAL: "default",
  DILAPORKAN_RUSAK: "destructive",
  MENUNGGU_VALIDASI: "secondary",
  DALAM_PERAWATAN: "secondary",
  TERJADWAL_PERAWATAN: "secondary",
  HILANG: "destructive",
  DIAJUKAN_HAPUS: "destructive",
  NONAKTIF: "outline",
};
