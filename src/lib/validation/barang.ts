import { z } from "zod";

// Format: [JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT] (mis. MEJA-2025-R201-0128)
const KODE_BARANG_REGEX = /^[A-Z0-9_]+(-[A-Z0-9_]+)*-\d{4}-[A-Z0-9]+-\d{4}$/;

export const createBarangSchema = z.object({
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  jenisId: z.string().min(1, "Jenis barang wajib dipilih"),
  kategoriApprovalId: z.string().min(1, "Kategori approval wajib dipilih"),
  tahunPembelian: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  lokasiTerdaftarId: z.string().min(1, "Lokasi terdaftar wajib dipilih"),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]),
  penguasaan: z.string().min(1, "Penguasaan wajib diisi"),
  // Plan A: kode eksplisit; Plan B: dikosongkan → auto-generate
  kodeBarang: z
    .string()
    .regex(KODE_BARANG_REGEX, "Format kode: JENIS-TAHUN-KODERU-XXXX (mis. MEJA-2025-R201-0128)")
    .optional(),
});

export type CreateBarangInput = z.infer<typeof createBarangSchema>;

export const updateBarangSchema = z.object({
  namaBarang: z.string().min(1, "Nama barang wajib diisi").optional(),
  jenisId: z.string().min(1).optional(),
  kategoriApprovalId: z.string().min(1).optional(),
  tahunPembelian: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  lokasiTerdaftarId: z.string().min(1).optional(),
  lokasiAktualId: z.string().min(1).optional(),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]).optional(),
  penguasaan: z.string().min(1).optional(),
});

export type UpdateBarangInput = z.infer<typeof updateBarangSchema>;

export const listBarangSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  jenisId: z.string().optional(),
  kondisi: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"]).optional(),
  statusBarang: z
    .enum([
      "NORMAL",
      "DILAPORKAN_RUSAK",
      "MENUNGGU_VALIDASI",
      "DALAM_PERAWATAN",
      "TERJADWAL_PERAWATAN",
      "HILANG",
      "DIAJUKAN_HAPUS",
      "NONAKTIF",
    ])
    .optional(),
  ruanganId: z.string().optional(),
  // T6-01: preset filter penanganan khusus (HILANG + DIAJUKAN_HAPUS + RUSAK_BERAT)
  penangananKhusus: z.coerce.boolean().optional(),
});

export type ListBarangInput = z.infer<typeof listBarangSchema>;
