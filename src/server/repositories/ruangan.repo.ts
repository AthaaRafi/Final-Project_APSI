import type { TipeRuangan } from "@prisma/client";
import { db } from "@/lib/db";

export function listRuangan(page: number, size: number, scopeIds?: string[]) {
  const where = scopeIds ? { id: { in: scopeIds } } : {};
  return Promise.all([
    db.ruangan.findMany({
      where,
      skip: page * size,
      take: size,
      orderBy: { namaRuangan: "asc" },
      include: {
        gedung: true,
        penanggungJawab: { include: { user: true } },
      },
    }),
    db.ruangan.count({ where }),
  ]);
}

export function findRuanganById(id: string) {
  return db.ruangan.findUnique({
    where: { id },
    include: {
      gedung: true,
      penanggungJawab: { include: { user: true } },
    },
  });
}

export function findRuanganByKode(kodeRuangan: string) {
  return db.ruangan.findUnique({ where: { kodeRuangan } });
}

export function findGedungById(id: string) {
  return db.gedung.findUnique({ where: { id } });
}

export function createRuangan(data: {
  kodeRuangan: string;
  namaRuangan: string;
  gedungId: string;
  tipe: TipeRuangan;
  lantai?: number | null;
}) {
  return db.ruangan.create({ data, include: { gedung: true, penanggungJawab: { include: { user: true } } } });
}

export function updateRuangan(
  id: string,
  data: {
    kodeRuangan: string;
    namaRuangan: string;
    gedungId: string;
    tipe: TipeRuangan;
    lantai?: number | null;
  },
) {
  return db.ruangan.update({
    where: { id },
    data,
    include: { gedung: true, penanggungJawab: { include: { user: true } } },
  });
}

export function deleteRuangan(id: string) {
  return db.ruangan.delete({ where: { id } });
}

export function countBarangByRuangan(ruanganId: string) {
  return db.barang.count({
    where: {
      OR: [{ lokasiTerdaftarId: ruanganId }, { lokasiAktualId: ruanganId }],
    },
  });
}

export function listPjLaboranUsers() {
  return db.user.findMany({
    where: { role: { in: ["PJ_RUANG", "LABORAN"] }, status: "ACTIVE" },
    orderBy: { nama: "asc" },
  });
}

export function setPenanggungJawab(ruanganId: string, userIds: string[]) {
  return db.$transaction(async (tx) => {
    await tx.userRuangan.deleteMany({ where: { ruanganId } });
    if (userIds.length > 0) {
      await tx.userRuangan.createMany({
        data: userIds.map((userId) => ({ ruanganId, userId })),
      });
    }
  });
}
