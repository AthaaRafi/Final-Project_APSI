import { db } from "@/lib/db";

// ── Konfigurasi Label ──────────────────────────────────────────────────────────

export async function getKonfigurasiLabel() {
  return db.konfigurasiLabel.findFirst();
}

export async function upsertKonfigurasiLabel(data: {
  ukuranPanjang?: number;
  ukuranLebar?: number;
  jumlahPerA4?: number;
  layoutKolom?: number;
  logoPath?: string;
}) {
  const existing = await db.konfigurasiLabel.findFirst();
  if (existing) {
    return db.konfigurasiLabel.update({ where: { id: existing.id }, data });
  }
  return db.konfigurasiLabel.create({ data: { ...data } });
}

// ── Log Cetak Label ────────────────────────────────────────────────────────────

export async function createLogCetak(data: {
  ruanganId: string;
  adminId: string;
  jumlahLabel: number;
  status: string;
}) {
  return db.logCetakLabel.create({ data });
}

export async function listLogCetak(page: number, size: number) {
  return db.$transaction([
    db.logCetakLabel.findMany({
      include: {
        ruangan: { select: { id: true, kodeRuangan: true, namaRuangan: true } },
      },
      orderBy: { tanggal: "desc" },
      skip: page * size,
      take: size,
    }),
    db.logCetakLabel.count(),
  ]);
}

// ── Barang untuk cetak label per ruangan ─────────────────────────────────────

export async function getBarangForLabel(ruanganId: string) {
  return db.barang.findMany({
    where: {
      lokasiTerdaftarId: ruanganId,
      deletedAt: null,
      statusBarang: { notIn: ["NONAKTIF"] },
    },
    include: {
      qr: {
        where: { aktif: true },
        take: 1,
      },
    },
    orderBy: { kodeBarang: "asc" },
  });
}
