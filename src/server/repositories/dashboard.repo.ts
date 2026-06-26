import type { StatusBarang } from "@prisma/client";
import { db } from "@/lib/db";

// ── Dashboard Global (INVENTARIS & PIMPINAN) ──────────────────────────────────

export async function getStatsGlobal() {
  const [
    totalBarang,
    totalRuangan,
    barangPerKondisi,
    barangPerStatus,
    pengajuanMenunggu,
    sesiAktif,
  ] = await Promise.all([
    db.barang.count({ where: { deletedAt: null } }),
    db.ruangan.count(),
    db.barang.groupBy({
      by: ["kondisi"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    db.barang.groupBy({
      by: ["statusBarang"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    db.pengajuan.count({ where: { status: "MENUNGGU" } }),
    db.stockOpname.count({ where: { status: "AKTIF" } }),
  ]);

  return {
    totalBarang,
    totalRuangan,
    barangPerKondisi: Object.fromEntries(
      barangPerKondisi.map((r) => [r.kondisi, r._count.id]),
    ),
    barangPerStatus: Object.fromEntries(
      barangPerStatus.map((r) => [r.statusBarang, r._count.id]),
    ),
    pengajuanMenunggu,
    sesiAktif,
  };
}

// ── Dashboard Area (PJ_RUANG / LABORAN) ──────────────────────────────────────

export async function getStatsArea(ruanganIds: string[]) {
  if (ruanganIds.length === 0) {
    return {
      totalBarang: 0,
      barangPerKondisi: {},
      barangPenangananKhusus: 0,
      pengajuanMenunggu: 0,
      sesiAktif: 0,
    };
  }

  const [
    totalBarang,
    barangPerKondisi,
    barangPenangananKhusus,
    pengajuanMenunggu,
    sesiAktif,
  ] = await Promise.all([
    db.barang.count({
      where: { lokasiTerdaftarId: { in: ruanganIds }, deletedAt: null },
    }),
    db.barang.groupBy({
      by: ["kondisi"],
      where: { lokasiTerdaftarId: { in: ruanganIds }, deletedAt: null },
      _count: { id: true },
    }),
    db.barang.count({
      where: {
        lokasiTerdaftarId: { in: ruanganIds },
        deletedAt: null,
        statusBarang: { in: ["HILANG", "DIAJUKAN_HAPUS", "RUSAK_BERAT"] as StatusBarang[] },
      },
    }),
    db.pengajuan.count({
      where: {
        status: "MENUNGGU",
        barang: { lokasiTerdaftarId: { in: ruanganIds } },
      },
    }),
    db.stockOpname.count({
      where: { ruanganId: { in: ruanganIds }, status: "AKTIF" },
    }),
  ]);

  return {
    totalBarang,
    barangPerKondisi: Object.fromEntries(
      barangPerKondisi.map((r) => [r.kondisi, r._count.id]),
    ),
    barangPenangananKhusus,
    pengajuanMenunggu,
    sesiAktif,
  };
}

// ── Dashboard PENGGUNA ────────────────────────────────────────────────────────

export async function getStatsPengguna(userId: string) {
  const [totalPengajuan, pengajuanMenunggu, pengajuanSelesai] = await Promise.all([
    db.pengajuan.count({ where: { pengajuId: userId } }),
    db.pengajuan.count({ where: { pengajuId: userId, status: "MENUNGGU" } }),
    db.pengajuan.count({ where: { pengajuId: userId, status: { in: ["SELESAI", "LANGSUNG_TERCATAT"] } } }),
  ]);
  return { totalPengajuan, pengajuanMenunggu, pengajuanSelesai };
}

// ── Notifikasi ────────────────────────────────────────────────────────────────

export async function listNotifikasiUser(userId: string, page: number, size: number) {
  return db.$transaction([
    db.notifikasi.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    db.notifikasi.count({ where: { userId } }),
  ]);
}

export async function countUnreadNotifikasi(userId: string) {
  return db.notifikasi.count({ where: { userId, dibaca: false } });
}

export async function markNotifikasiRead(id: string, userId: string) {
  return db.notifikasi.updateMany({
    where: { id, userId },
    data: { dibaca: true },
  });
}

export async function markAllNotifikasiRead(userId: string) {
  return db.notifikasi.updateMany({
    where: { userId, dibaca: false },
    data: { dibaca: true },
  });
}

export async function createNotifikasi(data: {
  userId: string;
  tipe: string;
  pesan: string;
  pengajuanId?: string;
  barangId?: string;
}) {
  return db.notifikasi.create({ data: { ...data } as Parameters<typeof db.notifikasi.create>[0]["data"] });
}
