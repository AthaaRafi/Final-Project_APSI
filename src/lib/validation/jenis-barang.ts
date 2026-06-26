import { z } from "zod";

export const createJenisBarangSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
});
export type CreateJenisBarangInput = z.infer<typeof createJenisBarangSchema>;

export const updateJenisBarangSchema = createJenisBarangSchema;
export type UpdateJenisBarangInput = z.infer<typeof updateJenisBarangSchema>;
