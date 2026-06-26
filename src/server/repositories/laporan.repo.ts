import type { Kondisi, Prisma, StatusBarang } from "@prisma/client";
import { db } from "@/lib/db";

// ── T6-03: Laporan Lokasi Barang (RPT-01/02) ──────────────────────────────────
// Barang yang lokasiTerdaftar ≠ lokasiAktual

export interface LokasiBarangFilter {
  search?: string;
  ruanganId?: string;
  jenisId?: string;
}

export async function listLokasiBarang(
  page: number,
  size: number,
  filter: LokasiBarangFilter = {},
) {
  // RPT-02: barang yang lokasiTerdaftar ≠ lokasiAktual
  // Prisma tidak support perbandingan antar-kolom langsung — ambil kandidat lalu filter di aplikasi
  const where: Prisma.BarangWhereInput = {
    deletedAt: null,
    ...(filter.search && {
      OR: [
        { namaBarang: { contains: filter.search } },
        { kodeBarang: { contains: filter.search } },
      ],
    }),
    ...(filter.ruanganId && {
      OR: [
        { lokasiTerdaftarId: filter.ruanganId },
        { lokasiAktualId: filter.ruanganId },
      ],
    }),
    ...(filter.jenisId && { jenisId: filter.jenisId }),
  };

  // Ambil semua kandidat lalu filter di aplikasi (jumlah barang per fakultas terbatas)
  const allMatching = await db.barang.findMany({
    where,
    select: { id: true, lokasiTerdaftarId: true, lokasiAktualId: true },
  });

  const anomaliIds = allMatching
    .filter((b) => b.lokasiTerdaftarId !== b.lokasiAktualId)
    .map((b) => b.id);

  const total = anomaliIds.length;
  const pageIds = anomaliIds.slice(page * size, page * size + size);

  if (pageIds.length === 0) return [[], total] as [typeof data, number];

  const data = await db.barang.findMany({
    where: { id: { in: pageIds } },
    include: {
      jenis: true,
      lokasiTerdaftar: { include: { gedung: true } },
      lokasiAktual: { include: { gedung: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return [data, total] as [typeof data, number];
}

// ── T6-05: Laporan Inventaris Lengkap ─────────────────────────────────────────

export interface LaporanInventarisFilter {
  search?: string;
  jenisId?: string;
  kondisi?: Kondisi;
  statusBarang?: StatusBarang;
  ruanganId?: string;
  tahunPembelianMin?: number;
  tahunPembelianMax?: number;
  flagVerifikasi?: string;
}

export async function listLaporanInventaris(
  page: number,
  size: number,
  filter: LaporanInventarisFilter = {},
) {
  const where: Prisma.BarangWhereInput = {
    deletedAt: null,
    ...(filter.search && {
      OR: [
        { namaBarang: { contains: filter.search } },
        { kodeBarang: { contains: filter.search } },
        { penguasaan: { contains: filter.search } },
        { jenis: { nama: { contains: filter.search } } },
      ],
    }),
    ...(filter.jenisId && { jenisId: filter.jenisId }),
    ...(filter.kondisi && { kondisi: filter.kondisi }),
    ...(filter.statusBarang && { statusBarang: filter.statusBarang }),
    ...(filter.flagVerifikasi && { flagVerifikasi: filter.flagVerifikasi as Prisma.EnumFlagVerifikasiFilter["equals"] }),
    ...(filter.ruanganId && {
      OR: [
        { lokasiTerdaftarId: filter.ruanganId },
        { lokasiAktualId: filter.ruanganId },
      ],
    }),
    ...((filter.tahunPembelianMin ?? filter.tahunPembelianMax) && {
      tahunPembelian: {
        ...(filter.tahunPembelianMin && { gte: filter.tahunPembelianMin }),
        ...(filter.tahunPembelianMax && { lte: filter.tahunPembelianMax }),
      },
    }),
  };

  return db.$transaction([
    db.barang.findMany({
      where,
      include: {
        jenis: true,
        kategoriApproval: true,
        lokasiTerdaftar: { include: { gedung: true } },
        lokasiAktual: { include: { gedung: true } },
      },
      orderBy: [{ lokasiTerdaftar: { kodeRuangan: "asc" } }, { kodeBarang: "asc" }],
      skip: page * size,
      take: size,
    }),
    db.barang.count({ where }),
  ]);
}

// ── T6-02: Histori Penghapusan Tahunan (HPS-03/04) ────────────────────────────

export async function listPenghapusanByTahun(tahun?: number) {
  const where: Prisma.PengajuanWhereInput = {
    jenis: "PENGHAPUSAN",
    ...(tahun && {
      createdAt: {
        gte: new Date(`${tahun}-01-01`),
        lt: new Date(`${tahun + 1}-01-01`),
      },
    }),
  };

  return db.pengajuan.findMany({
    where,
    include: {
      barang: {
        include: {
          jenis: true,
          lokasiTerdaftar: { include: { gedung: true } },
        },
      },
      pengaju: { select: { id: true, nama: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTahunPenghapusan(): Promise<number[]> {
  const rows = await db.$queryRaw<{ tahun: number }[]>`
    SELECT YEAR(created_at) as tahun
    FROM pengajuan
    WHERE jenis = 'PENGHAPUSAN'
    GROUP BY YEAR(created_at)
    ORDER BY tahun DESC
  `;
  return rows.map((r) => r.tahun);
}

// ── T6-06: Audit Trail (AUD-01) ───────────────────────────────────────────────

export async function listAuditLog(
  page: number,
  size: number,
  filter: { entitas?: string; aktor?: string } = {},
) {
  const where = {
    ...(filter.entitas && { entitas: filter.entitas }),
    ...(filter.aktor && { aktor: { contains: filter.aktor } }),
  };

  return db.$transaction([
    db.auditLog.findMany({
      where,
      orderBy: { waktu: "desc" },
      skip: page * size,
      take: size,
    }),
    db.auditLog.count({ where }),
  ]);
}
