import { db } from "@/lib/db";

export function listJenisBarang(page: number, size: number) {
  return Promise.all([
    db.jenisBarang.findMany({
      skip: page * size,
      take: size,
      orderBy: { nama: "asc" },
    }),
    db.jenisBarang.count(),
  ]);
}

export function findJenisBarangById(id: string) {
  return db.jenisBarang.findUnique({ where: { id } });
}

export function findJenisBarangByKode(kode: string) {
  return db.jenisBarang.findUnique({ where: { kode } });
}

export function createJenisBarang(data: { kode: string; nama: string }) {
  return db.jenisBarang.create({ data });
}

export function updateJenisBarang(id: string, data: { kode: string; nama: string }) {
  return db.jenisBarang.update({ where: { id }, data });
}

export function deleteJenisBarang(id: string) {
  return db.jenisBarang.delete({ where: { id } });
}

export function countBarangByJenis(jenisId: string) {
  return db.barang.count({ where: { jenisId } });
}
