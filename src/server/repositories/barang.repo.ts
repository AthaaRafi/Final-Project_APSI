import type { Kondisi, Prisma, StatusBarang } from "@prisma/client";
import { db } from "@/lib/db";

const BARANG_INCLUDE = {
  jenis: true,
  kategoriApproval: true,
  lokasiTerdaftar: { include: { gedung: true } },
  lokasiAktual: { include: { gedung: true } },
} satisfies Prisma.BarangInclude;

export type BarangWithRelations = Prisma.BarangGetPayload<{ include: typeof BARANG_INCLUDE }>;

export interface ListBarangFilter {
  search?: string;
  jenisId?: string;
  kondisi?: Kondisi;
  statusBarang?: StatusBarang;
  statusBarangIn?: StatusBarang[]; // T6-01: filter multi-status (preset penanganan khusus)
  ruanganId?: string; // scope: lokasiTerdaftarId OR lokasiAktualId
}

export async function listBarang(
  page: number,
  size: number,
  filter: ListBarangFilter = {},
): Promise<[BarangWithRelations[], number]> {
  const where: Prisma.BarangWhereInput = {
    deletedAt: null,
    ...(filter.search && {
      OR: [
        { namaBarang: { contains: filter.search } },
        { kodeBarang: { contains: filter.search } },
        { jenis: { nama: { contains: filter.search } } },
      ],
    }),
    ...(filter.jenisId && { jenisId: filter.jenisId }),
    ...(filter.kondisi && { kondisi: filter.kondisi }),
    ...(filter.statusBarang && { statusBarang: filter.statusBarang }),
    ...(filter.statusBarangIn?.length && { statusBarang: { in: filter.statusBarangIn } }),
    ...(filter.ruanganId && {
      OR: [
        { lokasiTerdaftarId: filter.ruanganId },
        { lokasiAktualId: filter.ruanganId },
      ],
    }),
  };

  return db.$transaction([
    db.barang.findMany({
      where,
      include: BARANG_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    db.barang.count({ where }),
  ]);
}

export async function findBarangById(id: string): Promise<BarangWithRelations | null> {
  return db.barang.findFirst({
    where: { id, deletedAt: null },
    include: BARANG_INCLUDE,
  });
}

export async function findBarangByKode(kode: string): Promise<BarangWithRelations | null> {
  return db.barang.findFirst({
    where: { kodeBarang: kode, deletedAt: null },
    include: BARANG_INCLUDE,
  });
}

export async function countNomorUrut(
  jenisKode: string,
  tahun: number,
  kodeRuangan: string,
): Promise<number> {
  // Count all barang (including soft-deleted) with matching prefix to avoid reuse
  const prefix = `${jenisKode}-${tahun}-${kodeRuangan}-`;
  return db.barang.count({
    where: { kodeBarang: { startsWith: prefix } },
  });
}

export async function createBarang(
  data: Prisma.BarangUncheckedCreateInput,
): Promise<BarangWithRelations> {
  return db.barang.create({ data, include: BARANG_INCLUDE });
}

export async function updateBarang(
  id: string,
  data: Prisma.BarangUncheckedUpdateInput,
): Promise<BarangWithRelations> {
  return db.barang.update({ where: { id }, data, include: BARANG_INCLUDE });
}

export async function softDeleteBarang(
  id: string,
  deletedBy: string,
): Promise<void> {
  await db.barang.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy,
      statusBarang: "NONAKTIF",
    },
  });
}

export async function deactivateQrForBarang(barangId: string): Promise<void> {
  await db.qrCode.updateMany({
    where: { barangId, aktif: true },
    data: { aktif: false },
  });
}

export async function createQrCode(data: {
  barangId: string;
  payload: string;
}): Promise<void> {
  // Deactivate existing QR codes for this barang before creating a new one
  await deactivateQrForBarang(data.barangId);
  await db.qrCode.create({
    data: {
      tipe: "BARANG",
      barangId: data.barangId,
      payload: data.payload,
      aktif: true,
    },
  });
}

export async function findActiveQrForBarang(
  barangId: string,
): Promise<{ id: string; payload: string } | null> {
  return db.qrCode.findFirst({
    where: { barangId, aktif: true },
    select: { id: true, payload: true },
  });
}

export async function findRiwayatBarang(barangId: string) {
  return db.riwayatBarang.findMany({
    where: { barangId },
    orderBy: { waktu: "desc" },
    take: 50,
  });
}

export async function writeRiwayatBarang(data: {
  barangId: string;
  aktivitas: string;
  aktor: string;
}): Promise<void> {
  await db.riwayatBarang.create({ data });
}
