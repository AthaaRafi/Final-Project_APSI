import { z } from "zod";

// ── Pemindahan ─────────────────────────────────────────────────────────────────

export const createPemindahanSchema = z.object({
  barangId: z.string().min(1, "Barang wajib dipilih"),
  lokasiTujuanId: z.string().min(1, "Lokasi tujuan wajib dipilih"),
  alasan: z.string().min(5, "Alasan minimal 5 karakter"),
});
export type CreatePemindahanInput = z.infer<typeof createPemindahanSchema>;

// ── Laporan kerusakan ──────────────────────────────────────────────────────────

export const createLaporanKerusakanSchema = z.object({
  barangId: z.string().min(1, "Barang wajib dipilih"),
  alasan: z.string().min(10, "Deskripsi kerusakan minimal 10 karakter"),
});
export type CreateLaporanKerusakanInput = z.infer<typeof createLaporanKerusakanSchema>;

// ── Usulan penghapusan ─────────────────────────────────────────────────────────

export const createPenghapusanSchema = z.object({
  barangId: z.string().min(1, "Barang wajib dipilih"),
  alasan: z.string().min(10, "Alasan penghapusan minimal 10 karakter"),
  sumber: z.enum(["LAPORAN_KERUSAKAN", "STOCK_OPNAME", "MANUAL"]),
  sumberRefId: z.string().optional(),
});
export type CreatePenghapusanInput = z.infer<typeof createPenghapusanSchema>;

// ── Approval (admin) ───────────────────────────────────────────────────────────

export const approvalActionSchema = z.object({
  aksi: z.enum(["approve", "reject", "revisi"]),
  catatan: z.string().optional(),
});
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

// ── List filter ────────────────────────────────────────────────────────────────

export const listPengajuanSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
  jenis: z.enum(["PEMINDAHAN", "PEMELIHARAAN", "KERUSAKAN", "PENGHAPUSAN"]).optional(),
  status: z
    .enum([
      "MENUNGGU",
      "DISETUJUI",
      "DITOLAK",
      "REVISI",
      "SELESAI",
      "LANGSUNG_TERCATAT",
      "DIBATALKAN",
    ])
    .optional(),
  barangId: z.string().optional(),
  mine: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});
export type ListPengajuanInput = z.infer<typeof listPengajuanSchema>;
