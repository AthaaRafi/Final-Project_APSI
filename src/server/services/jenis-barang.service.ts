import { ApiError } from "@/lib/api/errors";
import type { CreateJenisBarangInput, UpdateJenisBarangInput } from "@/lib/validation/jenis-barang";
import {
  countBarangByJenis,
  createJenisBarang,
  deleteJenisBarang,
  findJenisBarangByKode,
  findJenisBarangById,
  listJenisBarang,
  updateJenisBarang,
} from "@/server/repositories/jenis-barang.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function getJenisBarangList(page: number, size: number) {
  const [data, total] = await listJenisBarang(page, size);
  return { data, total };
}

export async function createJenisBarangEntry(input: CreateJenisBarangInput, aktor: string) {
  const existing = await findJenisBarangByKode(input.kode);
  if (existing) {
    throw ApiError.conflict("Kode jenis barang sudah digunakan");
  }

  const jenisBarang = await createJenisBarang(input);
  await writeAuditLog({
    aktor,
    aksi: "CREATE",
    entitas: "JenisBarang",
    entitasId: jenisBarang.id,
    detail: `Membuat jenis barang ${jenisBarang.kode} - ${jenisBarang.nama}`,
  });

  return jenisBarang;
}

export async function updateJenisBarangEntry(id: string, input: UpdateJenisBarangInput, aktor: string) {
  const existing = await findJenisBarangById(id);
  if (!existing) {
    throw ApiError.notFound("Jenis barang tidak ditemukan");
  }

  if (input.kode !== existing.kode) {
    const duplicate = await findJenisBarangByKode(input.kode);
    if (duplicate) {
      throw ApiError.conflict("Kode jenis barang sudah digunakan");
    }
  }

  const jenisBarang = await updateJenisBarang(id, input);
  await writeAuditLog({
    aktor,
    aksi: "UPDATE",
    entitas: "JenisBarang",
    entitasId: jenisBarang.id,
    detail: `Mengubah jenis barang ${existing.kode} - ${existing.nama} menjadi ${jenisBarang.kode} - ${jenisBarang.nama}`,
  });

  return jenisBarang;
}

export async function deleteJenisBarangEntry(id: string, aktor: string) {
  const existing = await findJenisBarangById(id);
  if (!existing) {
    throw ApiError.notFound("Jenis barang tidak ditemukan");
  }

  const jumlahBarang = await countBarangByJenis(id);
  if (jumlahBarang > 0) {
    throw ApiError.conflict("Jenis barang masih digunakan oleh barang dan tidak dapat dihapus");
  }

  await deleteJenisBarang(id);
  await writeAuditLog({
    aktor,
    aksi: "DELETE",
    entitas: "JenisBarang",
    entitasId: id,
    detail: `Menghapus jenis barang ${existing.kode} - ${existing.nama}`,
  });
}
