import type { JenisPengajuan, Prisma, StatusPengajuan } from "@prisma/client";
import { db } from "@/lib/db";

const PENGAJUAN_INCLUDE = {
  barang: {
    include: {
      jenis: true,
      lokasiTerdaftar: true,
      lokasiAktual: true,
      kategoriApproval: true,
    },
  },
  pengaju: { select: { id: true, nama: true, email: true, role: true } },
  lampiran: true,
} satisfies Prisma.PengajuanInclude;

export type PengajuanWithRelations = Prisma.PengajuanGetPayload<{
  include: typeof PENGAJUAN_INCLUDE;
}>;

export interface ListPengajuanFilter {
  jenis?: JenisPengajuan;
  status?: StatusPengajuan;
  barangId?: string;
  pengajuId?: string; // scope "mine"
  ruanganIds?: string[]; // scope area PJ/Laboran (asal atau tujuan)
}

export async function listPengajuan(
  page: number,
  size: number,
  filter: ListPengajuanFilter = {},
): Promise<[PengajuanWithRelations[], number]> {
  const where: Prisma.PengajuanWhereInput = {
    ...(filter.jenis && { jenis: filter.jenis }),
    ...(filter.status && { status: filter.status }),
    ...(filter.barangId && { barangId: filter.barangId }),
    ...(filter.pengajuId && { pengajuId: filter.pengajuId }),
    ...(filter.ruanganIds && {
      OR: [
        { lokasiAsalId: { in: filter.ruanganIds } },
        { lokasiTujuanId: { in: filter.ruanganIds } },
      ],
    }),
  };

  return db.$transaction([
    db.pengajuan.findMany({
      where,
      include: PENGAJUAN_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    db.pengajuan.count({ where }),
  ]);
}

export async function findPengajuanById(id: string): Promise<PengajuanWithRelations | null> {
  return db.pengajuan.findUnique({ where: { id }, include: PENGAJUAN_INCLUDE });
}

export async function findKonflikAktif(
  barangId: string,
  jenis: JenisPengajuan,
): Promise<{ id: string } | null> {
  // Pengajuan aktif = status yang belum final (bukan DITOLAK/SELESAI/LANGSUNG_TERCATAT/DIBATALKAN)
  const AKTIF_STATUS: StatusPengajuan[] = ["MENUNGGU", "DISETUJUI", "REVISI"];
  return db.pengajuan.findFirst({
    where: {
      barangId,
      jenis,
      status: { in: AKTIF_STATUS },
    },
    select: { id: true },
  });
}

export async function countPengajuanNomor(): Promise<number> {
  return db.pengajuan.count();
}

export async function createPengajuan(
  data: Prisma.PengajuanUncheckedCreateInput,
): Promise<PengajuanWithRelations> {
  return db.pengajuan.create({ data, include: PENGAJUAN_INCLUDE });
}

export async function updatePengajuanStatus(
  id: string,
  data: Prisma.PengajuanUncheckedUpdateInput,
): Promise<PengajuanWithRelations> {
  return db.pengajuan.update({ where: { id }, data, include: PENGAJUAN_INCLUDE });
}

export async function createLampiran(data: {
  pengajuanId: string;
  path: string;
  tipe: string;
}): Promise<void> {
  await db.lampiran.create({ data });
}

// Cek apakah user adalah PJ/Laboran yang bertanggung jawab atas ruangan
export async function isUserPjOfRuangan(
  userId: string,
  ruanganId: string,
): Promise<boolean> {
  const row = await db.userRuangan.findFirst({
    where: { userId, ruanganId },
    select: { id: true },
  });
  return !!row;
}

// Cari PJ aktif untuk suatu ruangan (untuk routing notifikasi & approval)
export async function findPjOfRuangan(ruanganId: string) {
  return db.userRuangan.findMany({
    where: { ruanganId },
    include: { user: { select: { id: true, nama: true, role: true, status: true } } },
  });
}
