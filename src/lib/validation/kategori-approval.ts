import { z } from "zod";

export const createKategoriApprovalSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  wajibApproval: z.boolean(),
  deskripsi: z.string().optional().nullable(),
});
export type CreateKategoriApprovalInput = z.infer<typeof createKategoriApprovalSchema>;

export const updateKategoriApprovalSchema = createKategoriApprovalSchema;
export type UpdateKategoriApprovalInput = z.infer<typeof updateKategoriApprovalSchema>;
