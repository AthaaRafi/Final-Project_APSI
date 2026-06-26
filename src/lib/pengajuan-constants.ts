import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { JenisPengajuan, StatusPengajuan } from "@/types/master";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const JENIS_PENGAJUAN_LABEL: Record<JenisPengajuan, string> = {
  PEMINDAHAN: "Pemindahan",
  PEMELIHARAAN: "Pemeliharaan",
  KERUSAKAN: "Laporan Kerusakan",
  PENGHAPUSAN: "Usulan Penghapusan",
};

export const STATUS_PENGAJUAN_LABEL: Record<StatusPengajuan, string> = {
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  REVISI: "Revisi",
  SELESAI: "Selesai",
  LANGSUNG_TERCATAT: "Langsung Tercatat",
  DIBATALKAN: "Dibatalkan",
};

export const STATUS_PENGAJUAN_VARIANT: Record<StatusPengajuan, BadgeVariant> = {
  MENUNGGU: "secondary",
  DISETUJUI: "default",
  DITOLAK: "destructive",
  REVISI: "outline",
  SELESAI: "default",
  LANGSUNG_TERCATAT: "default",
  DIBATALKAN: "outline",
};
