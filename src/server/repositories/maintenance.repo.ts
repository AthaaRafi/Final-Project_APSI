import { db } from "@/lib/db";

export function listJadwalMaintenance() {
  return db.jadwalMaintenance.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export function findJadwalById(id: string) {
  return db.jadwalMaintenance.findUnique({ where: { id } });
}

export function createJadwal(data: {
  jenisId?: string;
  barangId?: string;
  intervalBulan: number;
  nextDueDate?: Date;
  createdBy: string;
}) {
  return db.jadwalMaintenance.create({ data });
}

export function updateJadwal(id: string, data: {
  intervalBulan?: number;
  nextDueDate?: Date;
}) {
  return db.jadwalMaintenance.update({ where: { id }, data });
}

export function deleteJadwal(id: string) {
  return db.jadwalMaintenance.delete({ where: { id } });
}
