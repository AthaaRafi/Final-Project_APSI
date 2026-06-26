import { ApiError } from "@/lib/api/errors";
import { buildBarangPayload } from "@/lib/qr/generate";
import { deleteFile, saveFile } from "@/lib/storage";
import { extensionForMimeType, isAllowedImageType, MAX_IMAGE_SIZE_BYTES } from "@/lib/storage/validation";
import type { CreateBarangInput, ListBarangInput, UpdateBarangInput } from "@/lib/validation/barang";
import { writeAuditLog } from "@/server/repositories/audit.repo";
import {
  createBarang,
  createQrCode,
  findBarangById,
  findBarangByKode,
  countNomorUrut,
  listBarang,
  softDeleteBarang,
  updateBarang,
  writeRiwayatBarang,
  findActiveQrForBarang,
  findRiwayatBarang,
} from "@/server/repositories/barang.repo";
import { db } from "@/lib/db";

// ── Kode barang ────────────────────────────────────────────────────────────────

/**
 * Plan B: auto-generate kode barang.
 * Format: [JENIS]-[TAHUN]-[KODE_RUANGAN]-[NOMOR_URUT 4 digit]
 * Nomor urut = jumlah barang existing + 1 (termasuk deleted, agar tidak reuse nomor).
 */
async function generateKodeBarang(
  jenisKode: string,
  tahun: number,
  kodeRuangan: string,
): Promise<string> {
  const count = await countNomorUrut(jenisKode, tahun, kodeRuangan);
  const nomorUrut = (count + 1).toString().padStart(4, "0");
  return `${jenisKode}-${tahun}-${kodeRuangan}-${nomorUrut}`;
}

// ── List ───────────────────────────────────────────────────────────────────────

export async function getBarangList(
  input: ListBarangInput,
  scopeRuanganIds?: string[],
) {
  const filter = {
    search: input.search,
    jenisId: input.jenisId,
    kondisi: input.kondisi,
    statusBarang: input.penangananKhusus ? undefined : input.statusBarang,
    // T6-01: preset filter barang penanganan khusus
    statusBarangIn: input.penangananKhusus
      ? (["HILANG", "DIAJUKAN_HAPUS", "RUSAK_BERAT"] as import("@prisma/client").StatusBarang[])
      : undefined,
    ruanganId: scopeRuanganIds
      ? undefined // handled below via multi-ruangan scope
      : input.ruanganId,
  };

  // If caller provides a scope (PJ_RUANG/LABORAN) but also a specific ruanganId filter,
  // narrow to the intersection
  if (scopeRuanganIds) {
    const targetId = input.ruanganId;
    const effectiveIds = targetId
      ? scopeRuanganIds.filter((id) => id === targetId)
      : scopeRuanganIds;

    if (effectiveIds.length === 0) {
      return { data: [], total: 0 };
    }

    // For multi-ruangan scope, pass the first and let repo OR logic handle it
    // (repo currently supports single ruanganId; wrap in a multi-filter here)
    const results = await Promise.all(
      effectiveIds.map((id) =>
        listBarang(input.page, input.size, { ...filter, ruanganId: id }),
      ),
    );

    // Merge + deduplicate by id, re-apply paging
    const seen = new Set<string>();
    const merged = results
      .flatMap(([rows]) => rows)
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });
    const total = results.reduce((sum, [, c]) => sum + c, 0);
    const sliced = merged.slice(input.page * input.size, (input.page + 1) * input.size);
    return { data: sliced, total };
  }

  const [data, total] = await listBarang(input.page, input.size, filter);
  return { data, total };
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export async function getBarangDetail(id: string) {
  const barang = await findBarangById(id);
  if (!barang) throw ApiError.notFound("Barang tidak ditemukan");

  const [qr, riwayat] = await Promise.all([
    findActiveQrForBarang(id),
    findRiwayatBarang(id),
  ]);

  return { barang, qr, riwayat };
}

// ── Create ─────────────────────────────────────────────────────────────────────

export async function createBarangEntry(
  input: CreateBarangInput,
  fotoFile: { buffer: Buffer; mimeType: string; size: number },
  aktor: string,
) {
  // Validasi foto
  if (!isAllowedImageType(fotoFile.mimeType)) {
    throw ApiError.badRequest("Format foto tidak didukung (gunakan JPEG, PNG, atau WebP)");
  }
  if (fotoFile.size > MAX_IMAGE_SIZE_BYTES) {
    throw ApiError.badRequest("Ukuran foto maksimal 2 MB");
  }

  // Ambil data relasi yang dibutuhkan untuk kode dan QR
  const [ruangan, jenis] = await Promise.all([
    db.ruangan.findFirst({
      where: { id: input.lokasiTerdaftarId },
      select: { id: true, kodeRuangan: true },
    }),
    db.jenisBarang.findFirst({
      where: { id: input.jenisId },
      select: { id: true, kode: true },
    }),
  ]);

  if (!ruangan) throw ApiError.badRequest("Lokasi terdaftar tidak valid");
  if (!jenis) throw ApiError.badRequest("Jenis barang tidak valid");

  // Tentukan kode barang
  let kodeBarang = input.kodeBarang;
  if (!kodeBarang) {
    // Plan B: auto-generate
    kodeBarang = await generateKodeBarang(jenis.kode, input.tahunPembelian, ruangan.kodeRuangan);
  }

  // Cek duplikat kode
  const existing = await findBarangByKode(kodeBarang);
  if (existing) throw ApiError.conflict(`Kode barang "${kodeBarang}" sudah digunakan`);

  // Parse nomor urut dari kode
  const parts = kodeBarang.split("-");
  const nomorUrut = parseInt(parts[parts.length - 1] ?? "0", 10);

  // Simpan foto
  const ext = extensionForMimeType(fotoFile.mimeType);
  const fotoPath = await saveFile(fotoFile.buffer, "foto", ext);

  // Buat barang
  const barang = await createBarang({
    kodeBarang,
    namaBarang: input.namaBarang,
    jenisId: input.jenisId,
    kategoriApprovalId: input.kategoriApprovalId,
    tahunPembelian: input.tahunPembelian,
    nomorUrut,
    lokasiTerdaftarId: input.lokasiTerdaftarId,
    lokasiAktualId: input.lokasiTerdaftarId, // aktual = terdaftar saat baru dibuat
    kondisi: input.kondisi ?? "BAIK",
    penguasaan: input.penguasaan,
    fotoPath,
    createdBy: aktor,
    updatedBy: aktor,
  });

  // Generate dan simpan QR
  const payload = buildBarangPayload({
    idBarang: barang.id,
    kodeBarang: barang.kodeBarang,
    idRuangan: ruangan.id,
    kodeRuangan: ruangan.kodeRuangan,
    namaBarang: barang.namaBarang,
  });
  await createQrCode({ barangId: barang.id, payload: JSON.stringify(payload) });

  // Catat riwayat dan audit
  await Promise.all([
    writeRiwayatBarang({
      barangId: barang.id,
      aktivitas: `Barang dibuat dengan kode ${kodeBarang}`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "CREATE",
      entitas: "Barang",
      entitasId: barang.id,
      detail: `Membuat barang "${barang.namaBarang}" (${kodeBarang})`,
    }),
  ]);

  return barang;
}

// ── Update ─────────────────────────────────────────────────────────────────────

export async function updateBarangEntry(
  id: string,
  input: UpdateBarangInput,
  fotoFile: { buffer: Buffer; mimeType: string; size: number } | null,
  aktor: string,
) {
  const existing = await findBarangById(id);
  if (!existing) throw ApiError.notFound("Barang tidak ditemukan");

  let fotoPath: string | undefined;

  if (fotoFile) {
    if (!isAllowedImageType(fotoFile.mimeType)) {
      throw ApiError.badRequest("Format foto tidak didukung (gunakan JPEG, PNG, atau WebP)");
    }
    if (fotoFile.size > MAX_IMAGE_SIZE_BYTES) {
      throw ApiError.badRequest("Ukuran foto maksimal 2 MB");
    }
    const ext = extensionForMimeType(fotoFile.mimeType);
    fotoPath = await saveFile(fotoFile.buffer, "foto", ext);

    // Hapus foto lama jika ada
    if (existing.fotoPath) {
      await deleteFile(existing.fotoPath).catch(() => undefined);
    }
  }

  const barang = await updateBarang(id, {
    ...input,
    ...(fotoPath && { fotoPath }),
    updatedBy: aktor,
  });

  await Promise.all([
    writeRiwayatBarang({
      barangId: id,
      aktivitas: `Data barang diperbarui`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "UPDATE",
      entitas: "Barang",
      entitasId: id,
      detail: `Memperbarui barang "${existing.namaBarang}"`,
    }),
  ]);

  return barang;
}

// ── Soft delete ────────────────────────────────────────────────────────────────

export async function deleteBarangEntry(id: string, aktor: string) {
  const existing = await findBarangById(id);
  if (!existing) throw ApiError.notFound("Barang tidak ditemukan");

  await softDeleteBarang(id, aktor);

  await Promise.all([
    writeRiwayatBarang({
      barangId: id,
      aktivitas: `Barang dinonaktifkan (soft delete)`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "DELETE",
      entitas: "Barang",
      entitasId: id,
      detail: `Menonaktifkan barang "${existing.namaBarang}" (${existing.kodeBarang})`,
    }),
  ]);
}
