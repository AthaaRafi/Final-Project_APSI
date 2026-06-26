import { ApiError } from "@/lib/api/errors";
import { saveFile } from "@/lib/storage";
import { extensionForMimeType, isAllowedImageType, MAX_IMAGE_SIZE_BYTES } from "@/lib/storage/validation";
import type {
  ApprovalActionInput,
  CreateLaporanKerusakanInput,
  CreatePemindahanInput,
  CreatePenghapusanInput,
  ListPengajuanInput,
} from "@/lib/validation/pengajuan";
import { writeAuditLog } from "@/server/repositories/audit.repo";
import { findBarangById, updateBarang, writeRiwayatBarang } from "@/server/repositories/barang.repo";
import { createNotifikasi } from "@/server/repositories/dashboard.repo";
import {
  countPengajuanNomor,
  createLampiran,
  createPengajuan,
  findKonflikAktif,
  findPengajuanById,
  findPjOfRuangan,
  listPengajuan,
  updatePengajuanStatus,
} from "@/server/repositories/pengajuan.repo";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

// Fire-and-forget notifikasi (errors are swallowed to not block main flow)
function sendNotif(params: {
  userId: string;
  tipe: string;
  pesan: string;
  pengajuanId?: string;
  barangId?: string;
}) {
  createNotifikasi(params).catch(() => undefined);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateNomor(count: number): string {
  const tahun = new Date().getFullYear();
  const urut = String(count + 1).padStart(5, "0");
  return `PNG-${tahun}-${urut}`;
}

async function validateFotoFile(file: { buffer: Buffer; mimeType: string; size: number }) {
  if (!isAllowedImageType(file.mimeType)) {
    throw ApiError.badRequest("Format foto tidak didukung (JPEG, PNG, atau WebP)");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw ApiError.badRequest("Ukuran foto maksimal 2 MB");
  }
}

// ── List ───────────────────────────────────────────────────────────────────────

export async function getPengajuanList(
  input: ListPengajuanInput,
  session: { sub: string; role: string },
) {
  const filter: Parameters<typeof listPengajuan>[2] = {
    jenis: input.jenis,
    status: input.status,
    barangId: input.barangId,
    ...(input.mine && { pengajuId: session.sub }),
  };

  // PJ/Laboran: scope ke ruangan yang di-assign
  if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
    const ruanganIds = await getUserScopeRuanganIds(session.sub);
    if (!input.mine) {
      // Lihat pengajuan yang melibatkan ruangannya (asal/tujuan)
      filter.ruanganIds = ruanganIds;
    }
  }

  const [data, total] = await listPengajuan(input.page, input.size, filter);
  return { data, total };
}

export async function getPengajuanDetail(id: string) {
  const pengajuan = await findPengajuanById(id);
  if (!pengajuan) throw ApiError.notFound("Pengajuan tidak ditemukan");
  return pengajuan;
}

// ── Pemindahan (T4-01 + T4-02) ────────────────────────────────────────────────

export async function createPemindahanEntry(
  input: CreatePemindahanInput,
  aktor: string,
) {
  const barang = await findBarangById(input.barangId);
  if (!barang) throw ApiError.notFound("Barang tidak ditemukan");

  // PMD-02: lokasi tujuan harus berbeda dari lokasi aktual
  if (barang.lokasiAktualId === input.lokasiTujuanId) {
    throw ApiError.badRequest("Lokasi tujuan harus berbeda dari lokasi aktual barang");
  }

  // PNG-02: cek konflik aktif
  const konflik = await findKonflikAktif(input.barangId, "PEMINDAHAN");
  if (konflik) {
    throw ApiError.conflict("Barang ini sudah memiliki pengajuan pemindahan aktif");
  }

  const lokasiAsalId = barang.lokasiAktualId;
  const lokasiTujuanId = input.lokasiTujuanId;

  // Cek apakah antar-area: bandingkan PJ lokasi asal vs tujuan
  const [pjAsal, pjTujuan] = await Promise.all([
    findPjOfRuangan(lokasiAsalId),
    findPjOfRuangan(lokasiTujuanId),
  ]);

  const pjAsalIds = new Set(pjAsal.map((p) => p.userId));
  const pjTujuanIds = new Set(pjTujuan.map((p) => p.userId));
  const isAntarArea = ![...pjTujuanIds].some((id) => pjAsalIds.has(id));

  // KAT-02/03: cek wajib approval
  const wajibApproval = barang.kategoriApproval.wajibApproval;

  if (!wajibApproval) {
    // KAT-03: langsung tercatat, update lokasiAktual
    const count = await countPengajuanNomor();
    const pengajuan = await createPengajuan({
      nomor: generateNomor(count),
      jenis: "PEMINDAHAN",
      barangId: input.barangId,
      pengajuId: aktor,
      lokasiAsalId,
      lokasiTujuanId,
      isAntarArea,
      alasan: input.alasan,
      status: "LANGSUNG_TERCATAT",
    });

    // Update lokasiAktual langsung
    await updateBarang(input.barangId, { lokasiAktualId: lokasiTujuanId, updatedBy: aktor });
    await writeRiwayatBarang({
      barangId: input.barangId,
      aktivitas: `Pemindahan langsung tercatat dari ${barang.lokasiAktual.kodeRuangan} ke ${barang.lokasiTerdaftar.kodeRuangan !== lokasiTujuanId ? lokasiTujuanId : barang.lokasiTerdaftar.kodeRuangan}`,
      aktor,
    });
    await writeAuditLog({
      aktor,
      aksi: "PEMINDAHAN_LANGSUNG",
      entitas: "Pengajuan",
      entitasId: pengajuan.id,
      detail: `Pemindahan langsung tercatat barang ${barang.kodeBarang}`,
    });

    return { pengajuan, wajibApproval: false };
  }

  // KAT-04: buat pengajuan MENUNGGU
  const count = await countPengajuanNomor();
  const pengajuan = await createPengajuan({
    nomor: generateNomor(count),
    jenis: "PEMINDAHAN",
    barangId: input.barangId,
    pengajuId: aktor,
    lokasiAsalId,
    lokasiTujuanId,
    isAntarArea,
    alasan: input.alasan,
    status: "MENUNGGU",
  });

  await writeRiwayatBarang({
    barangId: input.barangId,
    aktivitas: `Pengajuan pemindahan dibuat (${pengajuan.nomor})`,
    aktor,
  });
  await writeAuditLog({
    aktor,
    aksi: "CREATE_PENGAJUAN",
    entitas: "Pengajuan",
    entitasId: pengajuan.id,
    detail: `Membuat pengajuan pemindahan ${pengajuan.nomor} untuk barang ${barang.kodeBarang}`,
  });

  // Notifikasi ke PJ lokasi tujuan (dan asal jika antar-area)
  const notifRecipients = new Set<string>();
  [...pjAsal, ...pjTujuan].forEach((pj) => notifRecipients.add(pj.userId));
  notifRecipients.delete(aktor);
  notifRecipients.forEach((uid) =>
    sendNotif({
      userId: uid,
      tipe: "PENGAJUAN_BARU",
      pesan: `Pengajuan pemindahan ${pengajuan.nomor} untuk barang ${barang.kodeBarang} menunggu persetujuan Anda.`,
      pengajuanId: pengajuan.id,
      barangId: input.barangId,
    }),
  );

  return { pengajuan, wajibApproval: true };
}

// ── Laporan kerusakan (T4-04) ──────────────────────────────────────────────────

export async function createLaporanKerusakanEntry(
  input: CreateLaporanKerusakanInput,
  fotoFile: { buffer: Buffer; mimeType: string; size: number } | null,
  aktor: string,
) {
  const barang = await findBarangById(input.barangId);
  if (!barang) throw ApiError.notFound("Barang tidak ditemukan");

  let lampiranPath: string | undefined;
  if (fotoFile) {
    await validateFotoFile(fotoFile);
    const ext = extensionForMimeType(fotoFile.mimeType);
    lampiranPath = await saveFile(fotoFile.buffer, "foto", ext);
  }

  const count = await countPengajuanNomor();
  const pengajuan = await createPengajuan({
    nomor: generateNomor(count),
    jenis: "KERUSAKAN",
    barangId: input.barangId,
    pengajuId: aktor,
    alasan: input.alasan,
    status: "MENUNGGU",
  });

  if (lampiranPath) {
    await createLampiran({ pengajuanId: pengajuan.id, path: lampiranPath, tipe: "foto" });
  }

  // Update statusBarang → DILAPORKAN_RUSAK (LAP-06)
  await updateBarang(input.barangId, { statusBarang: "DILAPORKAN_RUSAK", updatedBy: aktor });

  await Promise.all([
    writeRiwayatBarang({
      barangId: input.barangId,
      aktivitas: `Laporan kerusakan dibuat (${pengajuan.nomor})`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "CREATE_PENGAJUAN",
      entitas: "Pengajuan",
      entitasId: pengajuan.id,
      detail: `Laporan kerusakan ${pengajuan.nomor} untuk barang ${barang.kodeBarang}`,
    }),
  ]);

  // Notifikasi ke PJ area barang
  const pjList = await findPjOfRuangan(barang.lokasiAktualId);
  pjList.filter((pj) => pj.userId !== aktor).forEach((pj) =>
    sendNotif({
      userId: pj.userId,
      tipe: "LAPORAN_BARU",
      pesan: `Laporan kerusakan ${pengajuan.nomor} untuk barang ${barang.kodeBarang} memerlukan tindak lanjut Anda.`,
      pengajuanId: pengajuan.id,
      barangId: input.barangId,
    }),
  );

  return pengajuan;
}

// ── Usulan penghapusan (T4-05) ────────────────────────────────────────────────

export async function createPenghapusanEntry(
  input: CreatePenghapusanInput,
  fotoFile: { buffer: Buffer; mimeType: string; size: number } | null,
  aktor: string,
  aktorRole: string,
) {
  // HPS-09: hanya PJ_RUANG/LABORAN
  if (aktorRole !== "PJ_RUANG" && aktorRole !== "LABORAN") {
    throw ApiError.forbidden("Hanya PJ Ruang/Laboran yang dapat mengajukan penghapusan");
  }

  const barang = await findBarangById(input.barangId);
  if (!barang) throw ApiError.notFound("Barang tidak ditemukan");

  // PNG-02: cek konflik aktif
  const konflik = await findKonflikAktif(input.barangId, "PENGHAPUSAN");
  if (konflik) {
    throw ApiError.conflict("Barang ini sudah memiliki usulan penghapusan aktif");
  }

  let lampiranPath: string | undefined;
  if (fotoFile) {
    await validateFotoFile(fotoFile);
    const ext = extensionForMimeType(fotoFile.mimeType);
    lampiranPath = await saveFile(fotoFile.buffer, "foto", ext);
  }

  const count = await countPengajuanNomor();
  const pengajuan = await createPengajuan({
    nomor: generateNomor(count),
    jenis: "PENGHAPUSAN",
    barangId: input.barangId,
    pengajuId: aktor,
    alasan: input.alasan,
    sumber: input.sumber,
    sumberRefId: input.sumberRefId,
    status: "MENUNGGU",
  });

  if (lampiranPath) {
    await createLampiran({ pengajuanId: pengajuan.id, path: lampiranPath, tipe: "bukti" });
  }

  await Promise.all([
    writeRiwayatBarang({
      barangId: input.barangId,
      aktivitas: `Usulan penghapusan dibuat (${pengajuan.nomor})`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "CREATE_PENGAJUAN",
      entitas: "Pengajuan",
      entitasId: pengajuan.id,
      detail: `Usulan penghapusan ${pengajuan.nomor} untuk barang ${barang.kodeBarang}`,
    }),
  ]);

  return pengajuan;
}

// ── Pembatalan (PNG-08) ────────────────────────────────────────────────────────

export async function batalkanPengajuanEntry(id: string, aktor: string) {
  const pengajuan = await findPengajuanById(id);
  if (!pengajuan) throw ApiError.notFound("Pengajuan tidak ditemukan");

  // Hanya pengaju sendiri yang bisa membatalkan
  if (pengajuan.pengajuId !== aktor) {
    throw ApiError.forbidden("Anda tidak berhak membatalkan pengajuan ini");
  }

  // PNG-08: hanya bisa batalkan jika MENUNGGU atau BARU
  const bisaDibatalkan: string[] = ["MENUNGGU"];
  if (!bisaDibatalkan.includes(pengajuan.status)) {
    throw ApiError.badRequest("Pengajuan sudah diproses dan tidak dapat dibatalkan");
  }

  const updated = await updatePengajuanStatus(id, {
    status: "DIBATALKAN",
    updatedAt: new Date(),
  });

  await Promise.all([
    writeRiwayatBarang({
      barangId: pengajuan.barangId,
      aktivitas: `Pengajuan ${pengajuan.nomor} dibatalkan oleh pengaju`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "BATALKAN_PENGAJUAN",
      entitas: "Pengajuan",
      entitasId: id,
      detail: `Membatalkan pengajuan ${pengajuan.nomor}`,
    }),
  ]);

  return updated;
}

// ── Approval (T4-06 + T4-07) ──────────────────────────────────────────────────

export async function approvalPengajuanEntry(
  id: string,
  input: ApprovalActionInput,
  aktor: string,
  aktorRole: string,
) {
  const pengajuan = await findPengajuanById(id);
  if (!pengajuan) throw ApiError.notFound("Pengajuan tidak ditemukan");

  // Validasi: reject/revisi wajib ada catatan
  if ((input.aksi === "reject" || input.aksi === "revisi") && !input.catatan?.trim()) {
    throw ApiError.badRequest("Catatan alasan wajib diisi saat menolak atau meminta revisi");
  }

  // ── PEMINDAHAN: cek scope PJ/Laboran untuk dual-approval ──────────────────
  if (pengajuan.jenis === "PEMINDAHAN") {
    return await handleApprovalPemindahan(pengajuan, input, aktor, aktorRole);
  }

  // ── PENGHAPUSAN: hanya INVENTARIS (FA-07) ──────────────────────────────────
  if (pengajuan.jenis === "PENGHAPUSAN") {
    if (aktorRole !== "INVENTARIS") {
      throw ApiError.forbidden("Hanya Inventaris yang dapat memvalidasi penghapusan");
    }
    return await handleApprovalPenghapusan(pengajuan, input, aktor);
  }

  // ── KERUSAKAN: PJ_RUANG/LABORAN/INVENTARIS ────────────────────────────────
  if (pengajuan.jenis === "KERUSAKAN") {
    if (!["PJ_RUANG", "LABORAN", "INVENTARIS"].includes(aktorRole)) {
      throw ApiError.forbidden("Tidak memiliki izin untuk memproses laporan kerusakan");
    }
    return await handleApprovalKerusakan(pengajuan, input, aktor);
  }

  throw ApiError.badRequest("Jenis pengajuan tidak mendukung aksi approval ini");
}

async function handleApprovalPemindahan(
  pengajuan: Awaited<ReturnType<typeof findPengajuanById>> & object,
  input: ApprovalActionInput,
  aktor: string,
  aktorRole: string,
) {
  if (!pengajuan) throw ApiError.notFound("Pengajuan tidak ditemukan");

  if (pengajuan.status !== "MENUNGGU") {
    throw ApiError.badRequest("Pengajuan tidak dalam status menunggu");
  }

  if (!["PJ_RUANG", "LABORAN", "INVENTARIS"].includes(aktorRole)) {
    throw ApiError.forbidden("Tidak memiliki izin untuk approval pemindahan");
  }

  if (input.aksi === "reject") {
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "DITOLAK",
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "DITOLAK", aktor);
    return updated;
  }

  if (input.aksi === "revisi") {
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "REVISI",
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "REVISI", aktor);
    return updated;
  }

  // APPROVE
  if (!pengajuan.isAntarArea) {
    // 1 approval — langsung DISETUJUI + update lokasi
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "DISETUJUI",
      approvalAsalBy: aktor,
    });
    await _selesaikanPemindahan(pengajuan, aktor);
    return updated;
  }

  // Dual-approval: cek sisi mana yang approve
  const lokasiAsalId = pengajuan.lokasiAsalId;
  const lokasiTujuanId = pengajuan.lokasiTujuanId;

  // Tentukan apakah aktor adalah PJ asal atau tujuan
  const [isAsalPj, isTujuanPj] = await Promise.all([
    lokasiAsalId ? _isUserPjOrInventaris(aktor, aktorRole, lokasiAsalId) : Promise.resolve(false),
    lokasiTujuanId ? _isUserPjOrInventaris(aktor, aktorRole, lokasiTujuanId) : Promise.resolve(false),
  ]);

  const updateData: Record<string, unknown> = {};

  if (isAsalPj && !pengajuan.approvalAsalBy) {
    updateData.approvalAsalBy = aktor;
  } else if (isTujuanPj && !pengajuan.approvalTujuanBy) {
    updateData.approvalTujuanBy = aktor;
  } else if (aktorRole === "INVENTARIS") {
    // Fallback: Inventaris bisa approve keduanya
    if (!pengajuan.approvalAsalBy) updateData.approvalAsalBy = aktor;
    else if (!pengajuan.approvalTujuanBy) updateData.approvalTujuanBy = aktor;
  } else {
    throw ApiError.forbidden("Anda tidak bertanggung jawab atas ruangan yang terlibat dalam pengajuan ini");
  }

  const approvalAsalBy = (updateData.approvalAsalBy as string | undefined) ?? pengajuan.approvalAsalBy;
  const approvalTujuanBy = (updateData.approvalTujuanBy as string | undefined) ?? pengajuan.approvalTujuanBy;
  const keduaSudah = !!approvalAsalBy && !!approvalTujuanBy;

  if (keduaSudah) {
    updateData.status = "DISETUJUI";
  }

  const updated = await updatePengajuanStatus(pengajuan.id, updateData);

  if (keduaSudah) {
    await _selesaikanPemindahan(pengajuan, aktor);
  } else {
    await writeRiwayatBarang({
      barangId: pengajuan.barangId,
      aktivitas: `Approval parsial diterima untuk pengajuan pemindahan ${pengajuan.nomor}`,
      aktor,
    });
  }

  return updated;
}

async function _isUserPjOrInventaris(
  userId: string,
  role: string,
  ruanganId: string,
): Promise<boolean> {
  if (role === "INVENTARIS") return true;
  const { db } = await import("@/lib/db");
  const row = await db.userRuangan.findFirst({ where: { userId, ruanganId }, select: { id: true } });
  return !!row;
}

async function _selesaikanPemindahan(
  pengajuan: NonNullable<Awaited<ReturnType<typeof findPengajuanById>>>,
  aktor: string,
) {
  if (!pengajuan.lokasiTujuanId) return;

  // PMD-04: update lokasiAktual
  await updateBarang(pengajuan.barangId, {
    lokasiAktualId: pengajuan.lokasiTujuanId,
    updatedBy: aktor,
  });
  await updatePengajuanStatus(pengajuan.id, { status: "SELESAI" });
  await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "SELESAI", aktor);
}

async function handleApprovalPenghapusan(
  pengajuan: NonNullable<Awaited<ReturnType<typeof findPengajuanById>>>,
  input: ApprovalActionInput,
  aktor: string,
) {
  if (pengajuan.status !== "MENUNGGU") {
    throw ApiError.badRequest("Pengajuan tidak dalam status menunggu");
  }

  if (input.aksi === "approve") {
    await updatePengajuanStatus(pengajuan.id, { status: "DISETUJUI", approvalAsalBy: aktor });
    // HPS-02: status barang → DIAJUKAN_HAPUS
    await updateBarang(pengajuan.barangId, { statusBarang: "DIAJUKAN_HAPUS", updatedBy: aktor });
    const updated = await updatePengajuanStatus(pengajuan.id, { status: "SELESAI" });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "DIAJUKAN_HAPUS", aktor);
    return updated;
  }

  if (input.aksi === "reject") {
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "DITOLAK",
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "DITOLAK", aktor);
    return updated;
  }

  throw ApiError.badRequest("Aksi tidak valid untuk penghapusan");
}

async function handleApprovalKerusakan(
  pengajuan: NonNullable<Awaited<ReturnType<typeof findPengajuanById>>>,
  input: ApprovalActionInput,
  aktor: string,
) {
  if (!["MENUNGGU", "REVISI"].includes(pengajuan.status)) {
    throw ApiError.badRequest("Pengajuan tidak dapat diproses pada status ini");
  }

  if (input.aksi === "approve") {
    // LAP-09: MTC-02 → statusBarang DALAM_PERAWATAN
    await updateBarang(pengajuan.barangId, { statusBarang: "DALAM_PERAWATAN", updatedBy: aktor });
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "DISETUJUI",
      approvalAsalBy: aktor,
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "DALAM_PERAWATAN", aktor);
    return updated;
  }

  if (input.aksi === "reject") {
    // Kembalikan statusBarang ke NORMAL
    await updateBarang(pengajuan.barangId, { statusBarang: "NORMAL", updatedBy: aktor });
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "DITOLAK",
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "DITOLAK", aktor);
    return updated;
  }

  if (input.aksi === "revisi") {
    const updated = await updatePengajuanStatus(pengajuan.id, {
      status: "REVISI",
      catatanAdmin: input.catatan,
    });
    await _catatApproval(pengajuan.barangId, pengajuan.id, pengajuan.nomor ?? "", "REVISI", aktor);
    return updated;
  }

  throw ApiError.badRequest("Aksi tidak valid");
}

async function _catatApproval(
  barangId: string,
  pengajuanId: string,
  nomor: string,
  hasilLabel: string,
  aktor: string,
) {
  const pengajuan = await findPengajuanById(pengajuanId);

  const tipeNotifMap: Record<string, string> = {
    DISETUJUI: "PENGAJUAN_DISETUJUI",
    SELESAI: "PENGAJUAN_SELESAI",
    DITOLAK: "PENGAJUAN_DITOLAK",
    REVISI: "PENGAJUAN_REVISI",
    DIBATALKAN: "PENGAJUAN_DIBATALKAN",
  };
  const tipe = tipeNotifMap[hasilLabel] ?? "PENGAJUAN_SELESAI";
  const pesan = `Pengajuan ${nomor} telah diperbarui: ${hasilLabel}.`;

  await Promise.all([
    writeRiwayatBarang({
      barangId,
      aktivitas: `Status pengajuan ${nomor} → ${hasilLabel}`,
      aktor,
    }),
    writeAuditLog({
      aktor,
      aksi: "UPDATE_PENGAJUAN",
      entitas: "Pengajuan",
      entitasId: pengajuanId,
      detail: `Pengajuan ${nomor} → ${hasilLabel}`,
    }),
  ]);

  // Notifikasi ke pengaju (jika bukan aktor itu sendiri)
  if (pengajuan && pengajuan.pengajuId !== aktor) {
    sendNotif({ userId: pengajuan.pengajuId, tipe, pesan, pengajuanId, barangId });
  }
}
