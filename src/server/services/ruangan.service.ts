import { ApiError } from "@/lib/api/errors";
import type {
  AssignPenanggungJawabInput,
  CreateRuanganInput,
  UpdateRuanganInput,
} from "@/lib/validation/ruangan";
import {
  countBarangByRuangan,
  createRuangan,
  deleteRuangan,
  findGedungById,
  findRuanganByKode,
  findRuanganById,
  listPjLaboranUsers,
  listRuangan,
  setPenanggungJawab,
  updateRuangan,
} from "@/server/repositories/ruangan.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function getRuanganList(page: number, size: number, scopeRuanganIds?: string[]) {
  const [data, total] = await listRuangan(page, size, scopeRuanganIds);
  return { data, total };
}

export async function getPjLaboranOptions() {
  return listPjLaboranUsers();
}

async function ensureGedungExists(gedungId: string) {
  const gedung = await findGedungById(gedungId);
  if (!gedung) {
    throw ApiError.badRequest("Gedung tidak ditemukan");
  }
}

export async function createRuanganEntry(input: CreateRuanganInput, aktor: string) {
  const existing = await findRuanganByKode(input.kodeRuangan);
  if (existing) {
    throw ApiError.conflict("Kode ruangan sudah digunakan");
  }
  await ensureGedungExists(input.gedungId);

  const ruangan = await createRuangan(input);
  await writeAuditLog({
    aktor,
    aksi: "CREATE",
    entitas: "Ruangan",
    entitasId: ruangan.id,
    detail: `Membuat ruangan ${ruangan.kodeRuangan} - ${ruangan.namaRuangan}`,
  });

  return ruangan;
}

export async function updateRuanganEntry(id: string, input: UpdateRuanganInput, aktor: string) {
  const existing = await findRuanganById(id);
  if (!existing) {
    throw ApiError.notFound("Ruangan tidak ditemukan");
  }

  if (input.kodeRuangan !== existing.kodeRuangan) {
    const duplicate = await findRuanganByKode(input.kodeRuangan);
    if (duplicate) {
      throw ApiError.conflict("Kode ruangan sudah digunakan");
    }
  }

  await ensureGedungExists(input.gedungId);

  const ruangan = await updateRuangan(id, input);
  await writeAuditLog({
    aktor,
    aksi: "UPDATE",
    entitas: "Ruangan",
    entitasId: ruangan.id,
    detail: `Mengubah ruangan ${existing.kodeRuangan} - ${existing.namaRuangan} menjadi ${ruangan.kodeRuangan} - ${ruangan.namaRuangan}`,
  });

  return ruangan;
}

export async function deleteRuanganEntry(id: string, aktor: string) {
  const existing = await findRuanganById(id);
  if (!existing) {
    throw ApiError.notFound("Ruangan tidak ditemukan");
  }

  const jumlahBarang = await countBarangByRuangan(id);
  if (jumlahBarang > 0) {
    throw ApiError.conflict("Ruangan masih memiliki barang terdaftar dan tidak dapat dihapus");
  }

  await deleteRuangan(id);
  await writeAuditLog({
    aktor,
    aksi: "DELETE",
    entitas: "Ruangan",
    entitasId: id,
    detail: `Menghapus ruangan ${existing.kodeRuangan} - ${existing.namaRuangan}`,
  });
}

export async function assignPenanggungJawabEntry(
  id: string,
  input: AssignPenanggungJawabInput,
  aktor: string,
) {
  const existing = await findRuanganById(id);
  if (!existing) {
    throw ApiError.notFound("Ruangan tidak ditemukan");
  }

  if (input.userIds.length > 0) {
    const users = await listPjLaboranUsers();
    const validIds = new Set(users.map((u) => u.id));
    const invalid = input.userIds.filter((userId) => !validIds.has(userId));
    if (invalid.length > 0) {
      throw ApiError.badRequest("Terdapat user yang tidak valid sebagai PJ Ruang/Laboran");
    }
  }

  await setPenanggungJawab(id, input.userIds);
  await writeAuditLog({
    aktor,
    aksi: "ASSIGN_PJ",
    entitas: "Ruangan",
    entitasId: id,
    detail: `Mengatur penanggung jawab ruangan ${existing.kodeRuangan} - ${existing.namaRuangan}`,
  });

  return findRuanganById(id);
}
