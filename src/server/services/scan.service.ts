import type { Kondisi } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import type { QrBarangPayload, QrRuanganPayload } from "@/lib/qr/generate";
import type {
  MulaiSesiInput,
  ScanQrInput,
  SelesaikanSesiInput,
  SetRuanganAktualInput,
  TindakLanjutAnomaaliInput,
} from "@/lib/validation/scan";
import { writeAuditLog } from "@/server/repositories/audit.repo";
import { findBarangByKode, updateBarang, writeRiwayatBarang } from "@/server/repositories/barang.repo";
import {
  createSesi,
  findDetailById,
  findSesiById,
  getBaselineRuangan,
  getScannedBarangIds,
  updateSesiCounters,
  updateSesiStatus,
  upsertDetail,
} from "@/server/repositories/scan.repo";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseQrPayload(raw: string): QrBarangPayload | QrRuanganPayload {
  try {
    return JSON.parse(raw) as QrBarangPayload | QrRuanganPayload;
  } catch {
    throw ApiError.badRequest("Payload QR tidak valid (bukan JSON)");
  }
}

async function assertSesiAktifDanScope(
  opnameId: string,
  userId: string,
  userRole: string,
) {
  const sesi = await findSesiById(opnameId);
  if (!sesi) throw ApiError.notFound("Sesi opname tidak ditemukan");
  if (sesi.status !== "AKTIF") throw ApiError.badRequest("Sesi opname sudah tidak aktif");

  if (userRole === "PJ_RUANG" || userRole === "LABORAN") {
    const scopeIds = await getUserScopeRuanganIds(userId);
    if (!scopeIds.includes(sesi.ruanganId)) {
      throw ApiError.forbidden("Anda tidak memiliki akses ke ruangan opname ini");
    }
  }

  return sesi;
}

// ── T5-01 + T5-02: Mulai sesi ─────────────────────────────────────────────────

export async function mulaiSesi(input: MulaiSesiInput, aktor: string, aktorRole: string) {
  if (aktorRole !== "PJ_RUANG" && aktorRole !== "LABORAN" && aktorRole !== "INVENTARIS") {
    throw ApiError.forbidden("Hanya PJ Ruang, Laboran, atau Inventaris yang dapat memulai sesi scan");
  }

  if (aktorRole === "PJ_RUANG" || aktorRole === "LABORAN") {
    const scopeIds = await getUserScopeRuanganIds(aktor);
    if (!scopeIds.includes(input.ruanganId)) {
      throw ApiError.forbidden("Anda tidak memiliki akses ke ruangan ini");
    }
  }

  const sesi = await createSesi({
    ruanganId: input.ruanganId,
    adminId: aktor,
    tahunAnggaran: input.tahunAnggaran,
    catatan: input.catatan,
  });

  await writeAuditLog({
    aktor,
    aksi: "MULAI_SESI_OPNAME",
    entitas: "StockOpname",
    entitasId: sesi.id,
    detail: `Sesi opname dimulai untuk ruangan ${sesi.ruangan.kodeRuangan} tahun ${input.tahunAnggaran}`,
  });

  return sesi;
}

export async function getSesiDetail(opnameId: string, userId: string, userRole: string) {
  const sesi = await findSesiById(opnameId);
  if (!sesi) throw ApiError.notFound("Sesi opname tidak ditemukan");

  if (userRole === "PJ_RUANG" || userRole === "LABORAN") {
    const scopeIds = await getUserScopeRuanganIds(userId);
    if (!scopeIds.includes(sesi.ruanganId)) {
      throw ApiError.forbidden("Anda tidak memiliki akses ke ruangan opname ini");
    }
  }

  // Ambil baseline ruangan (BAS-01)
  const baseline = await getBaselineRuangan(sesi.ruanganId);

  return { sesi, baseline };
}

// ── T5-02: Set ruangan aktual dari QR Ruangan (SCN-16) ───────────────────────

export async function setRuanganAktual(input: SetRuanganAktualInput, userId: string, userRole: string) {
  await assertSesiAktifDanScope(input.opnameId, userId, userRole);

  const payload = parseQrPayload(input.qrPayload);
  if (payload.t !== "ruangan") {
    throw ApiError.badRequest("QR ini bukan QR Ruangan");
  }

  return { ruanganAktualId: (payload as QrRuanganPayload).id_ruangan, kodeRuangan: (payload as QrRuanganPayload).kode_ruangan };
}

// ── T5-03: Matching scan (SCN-02/03) ──────────────────────────────────────────

export async function prosesHasilScan(input: ScanQrInput, userId: string, userRole: string) {
  const sesi = await assertSesiAktifDanScope(input.opnameId, userId, userRole);

  const payload = parseQrPayload(input.qrPayload);

  if (payload.t === "ruangan") {
    // QR Ruangan discan — kembalikan sebagai info ruangan aktual (bukan scan barang)
    const rp = payload as QrRuanganPayload;
    return {
      tipe: "ruangan" as const,
      ruanganAktualId: rp.id_ruangan,
      kodeRuangan: rp.kode_ruangan,
      namaRuangan: rp.nama_ruangan,
    };
  }

  // QR Barang
  const bp = payload as QrBarangPayload;
  const kodeBarang = bp.kode_barang;
  const idBarang = bp.id_barang;

  // Cari barang by id_barang dari payload (lalu fallback ke kode)
  let barang = await findBarangByKode(kodeBarang);
  if (!barang && idBarang) {
    const { db } = await import("@/lib/db");
    barang = await db.barang.findFirst({
      where: { id: idBarang, deletedAt: null },
      include: {
        jenis: true,
        kategoriApproval: true,
        lokasiTerdaftar: { include: { gedung: true } },
        lokasiAktual: { include: { gedung: true } },
      },
    });
  }

  let statusMatching: "COCOK" | "TIDAK_COCOK" | "TIDAK_TERDAFTAR";
  let keterangan: string | undefined;
  let barangId: string | null = null;

  if (!barang) {
    // SCN-03: TIDAK_TERDAFTAR
    statusMatching = "TIDAK_TERDAFTAR";
    keterangan = `QR ${kodeBarang} tidak ditemukan dalam sistem`;
  } else {
    barangId = barang.id;
    if (barang.lokasiTerdaftarId === sesi.ruanganId) {
      // SCN-03: COCOK
      statusMatching = "COCOK";
    } else {
      // SCN-03: TIDAK_COCOK — barang terdaftar di ruangan lain
      statusMatching = "TIDAK_COCOK";
      // SCN-04: pesan lokasi seharusnya
      keterangan = `Seharusnya barang ini ada di ${barang.lokasiTerdaftar.kodeRuangan} — ${barang.lokasiTerdaftar.namaRuangan}, ${barang.lokasiTerdaftar.gedung.nama}`;
    }
  }

  // Auto-save tiap scan (SCN-11)
  const detail = await upsertDetail({
    opnameId: sesi.id,
    kodeBarangScan: kodeBarang,
    barangId,
    statusMatching,
    keterangan,
    ruanganAktualId: input.ruanganAktualId,
    kondisi: input.kondisi as Kondisi | undefined,
  });

  // Update counter
  await updateSesiCounters(sesi.id, {
    jumlahBarangScan: 1,
    ...(statusMatching === "COCOK" && { jumlahCocok: 1 }),
    ...(statusMatching === "TIDAK_COCOK" && { jumlahTidakCocok: 1 }),
    ...(statusMatching === "TIDAK_TERDAFTAR" && { jumlahTidakTerdaftar: 1 }),
  });

  // T5-08: Set flagVerifikasi = TERVERIFIKASI saat COCOK (SCN-07)
  if (statusMatching === "COCOK" && barang) {
    await updateBarang(barang.id, { flagVerifikasi: "TERVERIFIKASI", updatedBy: userId });
  }

  return {
    tipe: "barang" as const,
    statusMatching,
    keterangan,
    barang: barang
      ? {
          id: barang.id,
          kodeBarang: barang.kodeBarang,
          namaBarang: barang.namaBarang,
          kondisi: barang.kondisi,
          lokasiTerdaftar: {
            kodeRuangan: barang.lokasiTerdaftar.kodeRuangan,
            namaRuangan: barang.lokasiTerdaftar.namaRuangan,
            gedung: barang.lokasiTerdaftar.gedung.nama,
          },
        }
      : null,
    detail,
  };
}

// ── T5-07: Selesaikan sesi (SCN-05/SCN-06) ────────────────────────────────────

export async function selesaikanSesi(
  opnameId: string,
  input: SelesaikanSesiInput,
  userId: string,
  userRole: string,
) {
  const sesi = await assertSesiAktifDanScope(opnameId, userId, userRole);

  // Hitung jumlah hilang: baseline - yang sudah discan (SCN-05)
  const baseline = await getBaselineRuangan(sesi.ruanganId);
  const scannedIds = new Set(await getScannedBarangIds(opnameId));
  const hilang = baseline.filter((b) => !scannedIds.has(b.id));
  const jumlahHilang = hilang.length;

  // SCN-09: barang hilang → statusBarang = HILANG
  for (const b of hilang) {
    await updateBarang(b.id, { statusBarang: "HILANG", updatedBy: userId });
    await writeRiwayatBarang({
      barangId: b.id,
      aktivitas: `Ditandai HILANG dari hasil sesi stock opname #${sesi.nomor}`,
      aktor: userId,
    });
  }

  // SCN-09: TIDAK_TERDAFTAR → flagVerifikasi = ANOMALI (via upsertDetail kodeBarang)
  // (flagVerifikasi barang yang TIDAK_TERDAFTAR tidak punya id, jadi hanya dicatat di detail)

  const updated = await updateSesiStatus(opnameId, {
    status: "SELESAI",
    waktuSelesai: new Date(),
    catatan: input.catatan,
    jumlahHilang,
  });

  await writeAuditLog({
    aktor: userId,
    aksi: "SELESAI_SESI_OPNAME",
    entitas: "StockOpname",
    entitasId: opnameId,
    detail: `Sesi opname #${sesi.nomor} selesai. Hilang: ${jumlahHilang}`,
  });

  return { sesi: updated, jumlahHilang, hilang };
}

// ── T5-09: Tindak lanjut anomali per-item (SCN-08) ───────────────────────────

export async function tindakLanjutAnomali(
  input: TindakLanjutAnomaaliInput,
  userId: string,
  userRole: string,
) {
  const detail = await findDetailById(input.detailId);
  if (!detail) throw ApiError.notFound("Detail opname tidak ditemukan");

  // Verifikasi sesi sudah selesai (tindak lanjut hanya setelah selesai, SCN-08)
  const sesi = await findSesiById(detail.opnameId);
  if (!sesi) throw ApiError.notFound("Sesi opname tidak ditemukan");

  if (userRole === "PJ_RUANG" || userRole === "LABORAN") {
    const scopeIds = await getUserScopeRuanganIds(userId);
    if (!scopeIds.includes(sesi.ruanganId)) {
      throw ApiError.forbidden("Anda tidak memiliki akses ke sesi ini");
    }
  }

  // SCN-08: tindakan yang tersedia
  if (input.aksi === "PERBAIKI_LOKASI_AKTUAL") {
    if (!input.lokasiBaruId) throw ApiError.badRequest("lokasiBaruId wajib untuk aksi ini");
    if (!detail.barangId) throw ApiError.badRequest("Barang tidak dikenali, tidak bisa diperbaiki lokasinya");
    await updateBarang(detail.barangId, { lokasiAktualId: input.lokasiBaruId, updatedBy: userId });
    await writeRiwayatBarang({
      barangId: detail.barangId,
      aktivitas: `Lokasi aktual diperbaiki dari hasil tindak lanjut opname #${sesi.nomor}`,
      aktor: userId,
    });
  } else if (input.aksi === "SESUAIKAN_LOKASI_TERDAFTAR") {
    if (!input.lokasiBaruId) throw ApiError.badRequest("lokasiBaruId wajib untuk aksi ini");
    if (!detail.barangId) throw ApiError.badRequest("Barang tidak dikenali, tidak bisa disesuaikan");
    await updateBarang(detail.barangId, { lokasiTerdaftarId: input.lokasiBaruId, updatedBy: userId });
    await writeRiwayatBarang({
      barangId: detail.barangId,
      aktivitas: `Lokasi terdaftar disesuaikan dari hasil tindak lanjut opname #${sesi.nomor}`,
      aktor: userId,
    });
  } else if (input.aksi === "TANDAI_HILANG") {
    if (!detail.barangId) throw ApiError.badRequest("Barang tidak dikenali, tidak bisa ditandai hilang");
    await updateBarang(detail.barangId, { statusBarang: "HILANG", updatedBy: userId });
    await writeRiwayatBarang({
      barangId: detail.barangId,
      aktivitas: `Ditandai HILANG dari tindak lanjut opname #${sesi.nomor}`,
      aktor: userId,
    });
  }
  // CATAT_ANOMALI: tidak ada perubahan data, hanya pencatatan (sudah ada di detail)

  await writeAuditLog({
    aktor: userId,
    aksi: "TINDAK_LANJUT_ANOMALI",
    entitas: "StockOpnameDetail",
    entitasId: detail.id,
    detail: `${input.aksi} untuk detail opname #${sesi.nomor}`,
  });

  return { aksi: input.aksi, detail };
}
