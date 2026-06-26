import { ApiError } from "@/lib/api/errors";
import type { CreateGedungInput, UpdateGedungInput } from "@/lib/validation/gedung";
import {
  countRuanganByGedung,
  createGedung,
  deleteGedung,
  findGedungByKode,
  findGedungById,
  listGedung,
  updateGedung,
} from "@/server/repositories/gedung.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function getGedungList(page: number, size: number) {
  const [data, total] = await listGedung(page, size);
  return { data, total };
}

export async function createGedungEntry(input: CreateGedungInput, aktor: string) {
  const existing = await findGedungByKode(input.kode);
  if (existing) {
    throw ApiError.conflict("Kode gedung sudah digunakan");
  }

  const gedung = await createGedung(input);
  await writeAuditLog({
    aktor,
    aksi: "CREATE",
    entitas: "Gedung",
    entitasId: gedung.id,
    detail: `Membuat gedung ${gedung.kode} - ${gedung.nama}`,
  });

  return gedung;
}

export async function updateGedungEntry(id: string, input: UpdateGedungInput, aktor: string) {
  const existing = await findGedungById(id);
  if (!existing) {
    throw ApiError.notFound("Gedung tidak ditemukan");
  }

  if (input.kode !== existing.kode) {
    const duplicate = await findGedungByKode(input.kode);
    if (duplicate) {
      throw ApiError.conflict("Kode gedung sudah digunakan");
    }
  }

  const gedung = await updateGedung(id, input);
  await writeAuditLog({
    aktor,
    aksi: "UPDATE",
    entitas: "Gedung",
    entitasId: gedung.id,
    detail: `Mengubah gedung ${existing.kode} - ${existing.nama} menjadi ${gedung.kode} - ${gedung.nama}`,
  });

  return gedung;
}

export async function deleteGedungEntry(id: string, aktor: string) {
  const existing = await findGedungById(id);
  if (!existing) {
    throw ApiError.notFound("Gedung tidak ditemukan");
  }

  const jumlahRuangan = await countRuanganByGedung(id);
  if (jumlahRuangan > 0) {
    throw ApiError.conflict("Gedung masih memiliki ruangan terdaftar dan tidak dapat dihapus");
  }

  await deleteGedung(id);
  await writeAuditLog({
    aktor,
    aksi: "DELETE",
    entitas: "Gedung",
    entitasId: id,
    detail: `Menghapus gedung ${existing.kode} - ${existing.nama}`,
  });
}
