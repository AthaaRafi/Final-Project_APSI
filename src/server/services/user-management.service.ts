import type { Role } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import type { AssignUserRuanganInput, UpdateUserRoleInput, UpdateUserStatusInput } from "@/lib/validation/user-management";
import {
  clearUserRuangan,
  countActiveByRole,
  findRuanganByIds,
  findUserWithAreasById,
  listUsers,
  setUserRuangan,
  updateUserRole,
  updateUserStatus,
} from "@/server/repositories/user-management.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

const AREA_ROLES: Role[] = ["PJ_RUANG", "LABORAN"];

export async function getUserList(page: number, size: number) {
  const [data, total] = await listUsers(page, size);
  return { data, total };
}

async function ensureNotLastActiveInventaris(userId: string) {
  const target = await findUserWithAreasById(userId);
  if (!target) {
    throw ApiError.notFound("User tidak ditemukan");
  }

  if (target.role === "INVENTARIS" && target.status === "ACTIVE") {
    const activeInventaris = await countActiveByRole("INVENTARIS");
    if (activeInventaris <= 1) {
      throw ApiError.conflict("Tunjuk Inventaris lain dulu");
    }
  }

  return target;
}

export async function updateUserRoleEntry(id: string, input: UpdateUserRoleInput, aktor: string) {
  const existing = await ensureNotLastActiveInventaris(id);

  let areaWarning: string | undefined;
  const losesAreaAccess = AREA_ROLES.includes(existing.role) && !AREA_ROLES.includes(input.role);
  if (losesAreaAccess && existing.areas.length > 0) {
    await clearUserRuangan(id);
    areaWarning = `${existing.nama} sebelumnya bertanggung jawab atas ${existing.areas.length} ruangan. Ruangan tersebut kini tidak memiliki penanggung jawab — tunjuk pengganti secara manual.`;
  }

  const user = await updateUserRole(id, input.role);
  await writeAuditLog({
    aktor,
    aksi: "UPDATE_ROLE",
    entitas: "User",
    entitasId: id,
    detail: `Mengubah role ${existing.nama} dari ${existing.role} menjadi ${input.role}`,
  });

  return { user, areaWarning };
}

export async function updateUserStatusEntry(id: string, input: UpdateUserStatusInput, aktor: string) {
  const existing = await ensureNotLastActiveInventaris(id);

  let areaWarning: string | undefined;
  if (input.status === "INACTIVE" && AREA_ROLES.includes(existing.role) && existing.areas.length > 0) {
    areaWarning = `${existing.nama} masih bertanggung jawab atas ${existing.areas.length} ruangan. Ruangan tersebut akan kosong — tunjuk pengganti secara manual.`;
  }

  const user = await updateUserStatus(id, input.status);
  await writeAuditLog({
    aktor,
    aksi: input.status === "ACTIVE" ? "ACTIVATE" : "DEACTIVATE",
    entitas: "User",
    entitasId: id,
    detail: `Mengubah status ${existing.nama} dari ${existing.status} menjadi ${input.status}`,
  });

  return { user, areaWarning };
}

export async function assignUserRuanganEntry(id: string, input: AssignUserRuanganInput, aktor: string) {
  const existing = await findUserWithAreasById(id);
  if (!existing) {
    throw ApiError.notFound("User tidak ditemukan");
  }

  if (!AREA_ROLES.includes(existing.role)) {
    throw ApiError.badRequest("Hanya PJ Ruang/Laboran yang dapat di-assign ke ruangan");
  }

  if (input.ruanganIds.length > 0) {
    const ruangan = await findRuanganByIds(input.ruanganIds);
    if (ruangan.length !== input.ruanganIds.length) {
      throw ApiError.badRequest("Terdapat ruangan yang tidak valid");
    }
  }

  await setUserRuangan(id, input.ruanganIds);
  await writeAuditLog({
    aktor,
    aksi: "ASSIGN_RUANGAN",
    entitas: "User",
    entitasId: id,
    detail: `Mengatur penugasan ruangan untuk ${existing.nama}`,
  });

  return findUserWithAreasById(id);
}
