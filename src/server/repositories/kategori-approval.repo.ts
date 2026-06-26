import { db } from "@/lib/db";

export function listKategoriApproval(page: number, size: number) {
  return Promise.all([
    db.kategoriApproval.findMany({
      skip: page * size,
      take: size,
      orderBy: { nama: "asc" },
    }),
    db.kategoriApproval.count(),
  ]);
}

export function findKategoriApprovalById(id: string) {
  return db.kategoriApproval.findUnique({ where: { id } });
}

export function findKategoriApprovalByNama(nama: string) {
  return db.kategoriApproval.findFirst({ where: { nama } });
}

export function createKategoriApproval(data: {
  nama: string;
  wajibApproval: boolean;
  deskripsi?: string | null;
}) {
  return db.kategoriApproval.create({ data });
}

export function updateKategoriApproval(
  id: string,
  data: { nama: string; wajibApproval: boolean; deskripsi?: string | null },
) {
  return db.kategoriApproval.update({ where: { id }, data });
}

export function deleteKategoriApproval(id: string) {
  return db.kategoriApproval.delete({ where: { id } });
}

export function countBarangByKategoriApproval(kategoriApprovalId: string) {
  return db.barang.count({ where: { kategoriApprovalId } });
}
