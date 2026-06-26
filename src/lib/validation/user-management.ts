import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["PENGGUNA", "PJ_RUANG", "LABORAN", "INVENTARIS", "PIMPINAN"]),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const assignUserRuanganSchema = z.object({
  ruanganIds: z.array(z.string().min(1)),
});
export type AssignUserRuanganInput = z.infer<typeof assignUserRuanganSchema>;
