import { z } from "zod";

export const createGedungSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
});
export type CreateGedungInput = z.infer<typeof createGedungSchema>;

export const updateGedungSchema = createGedungSchema;
export type UpdateGedungInput = z.infer<typeof updateGedungSchema>;
