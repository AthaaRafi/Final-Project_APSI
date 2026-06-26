import type { Role, StatusUser } from "@prisma/client";
import { db } from "@/lib/db";

export function listUsers(page: number, size: number) {
  return Promise.all([
    db.user.findMany({
      skip: page * size,
      take: size,
      orderBy: { nama: "asc" },
      include: {
        areas: { include: { ruangan: true } },
      },
    }),
    db.user.count(),
  ]);
}

export function findUserWithAreasById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: { areas: { include: { ruangan: true } } },
  });
}

export function countActiveByRole(role: Role) {
  return db.user.count({ where: { role, status: "ACTIVE" } });
}

export function updateUserRole(id: string, role: Role) {
  return db.user.update({
    where: { id },
    data: { role },
    include: { areas: { include: { ruangan: true } } },
  });
}

export function updateUserStatus(id: string, status: StatusUser) {
  return db.user.update({
    where: { id },
    data: { status },
    include: { areas: { include: { ruangan: true } } },
  });
}

export function findRuanganByIds(ids: string[]) {
  return db.ruangan.findMany({ where: { id: { in: ids } } });
}

export function setUserRuangan(userId: string, ruanganIds: string[]) {
  return db.$transaction(async (tx) => {
    await tx.userRuangan.deleteMany({ where: { userId } });
    if (ruanganIds.length > 0) {
      await tx.userRuangan.createMany({
        data: ruanganIds.map((ruanganId) => ({ userId, ruanganId })),
      });
    }
  });
}

export function clearUserRuangan(userId: string) {
  return db.userRuangan.deleteMany({ where: { userId } });
}

export async function getUserScopeRuanganIds(userId: string): Promise<string[]> {
  const rows = await db.userRuangan.findMany({
    where: { userId },
    select: { ruanganId: true },
  });
  return rows.map((r) => r.ruanganId);
}
