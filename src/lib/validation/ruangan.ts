import { z } from "zod";

export const createRuanganSchema = z.object({
  kodeRuangan: z.string().min(1, "Kode ruangan wajib diisi"),
  namaRuangan: z.string().min(1, "Nama ruangan wajib diisi"),
  gedungId: z.string().min(1, "Gedung wajib dipilih"),
  tipe: z.enum(["KELAS", "LABORATORIUM"]),
  lantai: z.number().int().optional().nullable(),
});
export type CreateRuanganInput = z.infer<typeof createRuanganSchema>;

export const updateRuanganSchema = createRuanganSchema;
export type UpdateRuanganInput = z.infer<typeof updateRuanganSchema>;

export const assignPenanggungJawabSchema = z.object({
  userIds: z.array(z.string().min(1)),
});
export type AssignPenanggungJawabInput = z.infer<typeof assignPenanggungJawabSchema>;
