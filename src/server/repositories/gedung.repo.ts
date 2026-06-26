import { db } from "@/lib/db";

export function listGedung(page: number, size: number) {
  return Promise.all([
    db.gedung.findMany({
      skip: page * size,
      take: size,
      orderBy: { nama: "asc" },
    }),
    db.gedung.count(),
  ]);
}

export function findGedungById(id: string) {
  return db.gedung.findUnique({ where: { id } });
}

export function findGedungByKode(kode: string) {
  return db.gedung.findUnique({ where: { kode } });
}

export function createGedung(data: { kode: string; nama: string }) {
  return db.gedung.create({ data });
}

export function updateGedung(id: string, data: { kode: string; nama: string }) {
  return db.gedung.update({ where: { id }, data });
}

export function deleteGedung(id: string) {
  return db.gedung.delete({ where: { id } });
}

export function countRuanganByGedung(gedungId: string) {
  return db.ruangan.count({ where: { gedungId } });
}
