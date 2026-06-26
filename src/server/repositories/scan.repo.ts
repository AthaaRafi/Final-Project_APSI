import type { Kondisi, Prisma, StatusMatching } from "@prisma/client";
import { db } from "@/lib/db";

// ── Include ────────────────────────────────────────────────────────────────────

const DETAIL_INCLUDE = {
  barang: {
    include: {
      jenis: true,
      lokasiTerdaftar: { include: { gedung: true } },
      lokasiAktual: { include: { gedung: true } },
    },
  },
  ruanganAktual: { include: { gedung: true } },
} satisfies Prisma.StockOpnameDetailInclude;

const OPNAME_INCLUDE = {
  ruangan: { include: { gedung: true } },
  admin: { select: { id: true, nama: true, email: true } },
  detail: { include: DETAIL_INCLUDE, orderBy: { waktuScan: "asc" as const } },
} satisfies Prisma.StockOpnameInclude;

export type OpnameWithRelations = Prisma.StockOpnameGetPayload<{ include: typeof OPNAME_INCLUDE }>;
export type OpnameDetailWithRelations = Prisma.StockOpnameDetailGetPayload<{ include: typeof DETAIL_INCLUDE }>;

// ── Sesi ───────────────────────────────────────────────────────────────────────

export async function createSesi(data: {
  ruanganId: string;
  adminId: string;
  tahunAnggaran: number;
  catatan?: string;
}) {
  return db.stockOpname.create({
    data: {
      ruanganId: data.ruanganId,
      adminId: data.adminId,
      tahunAnggaran: data.tahunAnggaran,
      catatan: data.catatan,
      status: "AKTIF",
    },
    include: OPNAME_INCLUDE,
  });
}

export async function findSesiById(id: string) {
  return db.stockOpname.findUnique({ where: { id }, include: OPNAME_INCLUDE });
}

export async function findSesiAktifByRuangan(ruanganId: string, adminId: string) {
  return db.stockOpname.findFirst({
    where: { ruanganId, adminId, status: "AKTIF" },
    include: OPNAME_INCLUDE,
    orderBy: { tanggalScan: "desc" },
  });
}

export async function listSesi(
  adminId: string,
  ruanganIds: string[],
  page: number,
  size: number,
): Promise<[OpnameWithRelations[], number]> {
  const where: Prisma.StockOpnameWhereInput =
    ruanganIds.length > 0
      ? { ruanganId: { in: ruanganIds } }
      : { adminId };

  return db.$transaction([
    db.stockOpname.findMany({
      where,
      include: OPNAME_INCLUDE,
      orderBy: { tanggalScan: "desc" },
      skip: page * size,
      take: size,
    }),
    db.stockOpname.count({ where }),
  ]);
}

export async function updateSesiStatus(
  id: string,
  data: {
    status: "SELESAI" | "BATAL";
    waktuSelesai?: Date;
    catatan?: string;
    jumlahBarangScan?: number;
    jumlahCocok?: number;
    jumlahTidakCocok?: number;
    jumlahTidakTerdaftar?: number;
    jumlahHilang?: number;
  },
) {
  return db.stockOpname.update({ where: { id }, data });
}

export async function updateSesiCounters(
  id: string,
  delta: {
    jumlahBarangScan?: number;
    jumlahCocok?: number;
    jumlahTidakCocok?: number;
    jumlahTidakTerdaftar?: number;
  },
) {
  return db.stockOpname.update({
    where: { id },
    data: {
      ...(delta.jumlahBarangScan !== undefined && { jumlahBarangScan: { increment: delta.jumlahBarangScan } }),
      ...(delta.jumlahCocok !== undefined && { jumlahCocok: { increment: delta.jumlahCocok } }),
      ...(delta.jumlahTidakCocok !== undefined && { jumlahTidakCocok: { increment: delta.jumlahTidakCocok } }),
      ...(delta.jumlahTidakTerdaftar !== undefined && { jumlahTidakTerdaftar: { increment: delta.jumlahTidakTerdaftar } }),
    },
  });
}

// ── Detail / hasil scan ────────────────────────────────────────────────────────

export async function upsertDetail(data: {
  opnameId: string;
  kodeBarangScan: string;
  barangId: string | null;
  statusMatching: StatusMatching;
  keterangan?: string;
  ruanganAktualId?: string;
  kondisi?: Kondisi;
}) {
  // Cegah duplikat: satu kodeBarang per sesi — upsert berdasarkan (opnameId, kodeBarangScan)
  const existing = await db.stockOpnameDetail.findFirst({
    where: { opnameId: data.opnameId, kodeBarangScan: data.kodeBarangScan },
  });

  if (existing) {
    return db.stockOpnameDetail.update({
      where: { id: existing.id },
      data: {
        statusMatching: data.statusMatching,
        keterangan: data.keterangan,
        ruanganAktualId: data.ruanganAktualId,
        kondisi: data.kondisi,
        waktuScan: new Date(),
      },
      include: DETAIL_INCLUDE,
    });
  }

  return db.stockOpnameDetail.create({
    data: {
      opnameId: data.opnameId,
      kodeBarangScan: data.kodeBarangScan,
      barangId: data.barangId,
      statusMatching: data.statusMatching,
      keterangan: data.keterangan,
      ruanganAktualId: data.ruanganAktualId,
      kondisi: data.kondisi,
    },
    include: DETAIL_INCLUDE,
  });
}

export async function findDetailById(id: string) {
  return db.stockOpnameDetail.findUnique({ where: { id }, include: DETAIL_INCLUDE });
}

export async function findDetailByBarang(opnameId: string, barangId: string) {
  return db.stockOpnameDetail.findFirst({
    where: { opnameId, barangId },
    include: DETAIL_INCLUDE,
  });
}

// Ambil kode barang yang sudah discan (untuk hitung hilang)
export async function getScannedBarangIds(opnameId: string): Promise<string[]> {
  const rows = await db.stockOpnameDetail.findMany({
    where: { opnameId, barangId: { not: null } },
    select: { barangId: true },
  });
  return rows.map((r) => r.barangId).filter(Boolean) as string[];
}

// Baseline: barang terdaftar di ruangan (BAS-01)
export async function getBaselineRuangan(ruanganId: string) {
  return db.barang.findMany({
    where: { lokasiTerdaftarId: ruanganId, deletedAt: null },
    select: {
      id: true,
      kodeBarang: true,
      namaBarang: true,
      kondisi: true,
      statusBarang: true,
      lokasiTerdaftar: { select: { id: true, kodeRuangan: true, namaRuangan: true, gedung: { select: { nama: true } } } },
      lokasiAktual: { select: { id: true, kodeRuangan: true, namaRuangan: true } },
    },
  });
}
