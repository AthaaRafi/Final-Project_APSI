import { z } from "zod";

// ── Mulai sesi ─────────────────────────────────────────────────────────────────

export const mulaiSesiSchema = z.object({
  ruanganId: z.string().min(1, "Ruangan wajib dipilih"),
  tahunAnggaran: z.number().int().min(2000).max(2100),
  catatan: z.string().optional(),
});
export type MulaiSesiInput = z.infer<typeof mulaiSesiSchema>;

// Untuk parsing dari request.json() — angka bisa datang sebagai string dari HTML form
export const mulaiSesiServerSchema = mulaiSesiSchema.extend({
  tahunAnggaran: z.coerce.number().int().min(2000).max(2100),
});

// ── Scan QR ───────────────────────────────────────────────────────────────────

export const scanQrSchema = z.object({
  opnameId: z.string().min(1),
  // payload JSON dari kamera (string mentah dari QR)
  qrPayload: z.string().min(1, "Payload QR wajib diisi"),
  // ID ruangan aktual: diset dari QR Ruangan yang terakhir discan
  ruanganAktualId: z.string().optional(),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]).optional(),
});
export type ScanQrInput = z.infer<typeof scanQrSchema>;

// ── Set ruangan aktual (dari scan QR Ruangan) ─────────────────────────────────

export const setRuanganAktualSchema = z.object({
  opnameId: z.string().min(1),
  qrPayload: z.string().min(1, "Payload QR Ruangan wajib diisi"),
});
export type SetRuanganAktualInput = z.infer<typeof setRuanganAktualSchema>;

// ── Selesaikan sesi ───────────────────────────────────────────────────────────

export const selesaikanSesiSchema = z.object({
  catatan: z.string().optional(),
});
export type SelesaikanSesiInput = z.infer<typeof selesaikanSesiSchema>;

// ── Tindak lanjut anomali ─────────────────────────────────────────────────────

export const tindakLanjutAnomaaliSchema = z.object({
  detailId: z.string().min(1),
  aksi: z.enum(["PERBAIKI_LOKASI_AKTUAL", "SESUAIKAN_LOKASI_TERDAFTAR", "TANDAI_HILANG", "CATAT_ANOMALI"]),
  lokasiBaruId: z.string().optional(),
});
export type TindakLanjutAnomaaliInput = z.infer<typeof tindakLanjutAnomaaliSchema>;
