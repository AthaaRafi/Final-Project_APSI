import { z } from "zod";

export const createJadwalSchema = z.object({
  jenisId: z.string().min(1, "Jenis barang wajib dipilih"),
  intervalBulan: z.coerce.number().int().min(1, "Interval minimal 1 bulan").max(60, "Interval maksimal 60 bulan"),
});
export type CreateJadwalInput = z.infer<typeof createJadwalSchema>;

export const updateJadwalSchema = z.object({
  intervalBulan: z.coerce.number().int().min(1).max(60),
});
export type UpdateJadwalInput = z.infer<typeof updateJadwalSchema>;
