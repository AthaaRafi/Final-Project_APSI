import { ApiError } from "@/lib/api/errors";
import type {
  CreateKategoriApprovalInput,
  UpdateKategoriApprovalInput,
} from "@/lib/validation/kategori-approval";
import {
  countBarangByKategoriApproval,
  createKategoriApproval,
  deleteKategoriApproval,
  findKategoriApprovalById,
  listKategoriApproval,
  updateKategoriApproval,
} from "@/server/repositories/kategori-approval.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function getKategoriApprovalList(page: number, size: number) {
  const [data, total] = await listKategoriApproval(page, size);
  return { data, total };
}

export async function createKategoriApprovalEntry(input: CreateKategoriApprovalInput, aktor: string) {
  const kategori = await createKategoriApproval(input);
  await writeAuditLog({
    aktor,
    aksi: "CREATE",
    entitas: "KategoriApproval",
    entitasId: kategori.id,
    detail: `Membuat kategori approval ${kategori.nama} (wajib approval: ${kategori.wajibApproval ? "ya" : "tidak"})`,
  });

  return kategori;
}

export async function updateKategoriApprovalEntry(
  id: string,
  input: UpdateKategoriApprovalInput,
  aktor: string,
) {
  const existing = await findKategoriApprovalById(id);
  if (!existing) {
    throw ApiError.notFound("Kategori approval tidak ditemukan");
  }

  const kategori = await updateKategoriApproval(id, input);
  await writeAuditLog({
    aktor,
    aksi: "UPDATE",
    entitas: "KategoriApproval",
    entitasId: kategori.id,
    detail: `Mengubah kategori approval ${existing.nama} menjadi ${kategori.nama} (wajib approval: ${kategori.wajibApproval ? "ya" : "tidak"})`,
  });

  return kategori;
}

export async function deleteKategoriApprovalEntry(id: string, aktor: string) {
  const existing = await findKategoriApprovalById(id);
  if (!existing) {
    throw ApiError.notFound("Kategori approval tidak ditemukan");
  }

  const jumlahBarang = await countBarangByKategoriApproval(id);
  if (jumlahBarang > 0) {
    throw ApiError.conflict("Kategori approval masih digunakan oleh barang dan tidak dapat dihapus");
  }

  await deleteKategoriApproval(id);
  await writeAuditLog({
    aktor,
    aksi: "DELETE",
    entitas: "KategoriApproval",
    entitasId: id,
    detail: `Menghapus kategori approval ${existing.nama}`,
  });
}
