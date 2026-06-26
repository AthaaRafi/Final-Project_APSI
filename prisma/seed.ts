import { PrismaClient, TipeRuangan, TipeQr } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Akun dev — password plaintext ada di komentar, hash di-generate sekali pakai bcrypt cost 10
  const DEV_ACCOUNTS = [
    { id: "seed-user-inventaris", email: "admin@uns.ac.id",     nama: "Admin Inventaris", role: "INVENTARIS" as const, hash: "$2b$10$E54L7RM/.czJWtMiwc256.scooPLPyYkgxXiVQugMzp8w0hOyiEhq" }, // admin123
    { id: "seed-user-pj",        email: "pj@uns.ac.id",        nama: "PJ Ruang Demo",   role: "PJ_RUANG"   as const, hash: "$2b$10$BefKPrSxKwoj5kTW4V9rr.gcBmQIho/VlfExLB63uD2OTwsSfrbU6" }, // pj123
    { id: "seed-user-laboran",   email: "laboran@uns.ac.id",   nama: "Laboran Demo",    role: "LABORAN"    as const, hash: "$2b$10$mXsY61vGTLQ8CCkSnu9CHuWWJGph1u2w5wvnBf0A2uk5fRHqz7r8W" }, // laboran123
    { id: "seed-user-pengguna",  email: "pengguna@uns.ac.id",  nama: "Pengguna Demo",   role: "PENGGUNA"   as const, hash: "$2b$10$tssqOC2gz0eo9poS/EGSFemfBAg1FOrZOPzU4S4asOP62/ExM1vee"  }, // pengguna123
    { id: "seed-user-pimpinan",  email: "pimpinan@uns.ac.id",  nama: "Pimpinan Demo",   role: "PIMPINAN"   as const, hash: "$2b$10$ONwmVNajh7CW6o0sgZkue.hE1meSfP6KgSPohEC4YCvGba2tGKUHK" }, // pimpinan123
  ];

  for (const acc of DEV_ACCOUNTS) {
    await prisma.user.upsert({
      where: { id: acc.id },
      update: { passwordHash: acc.hash, status: "ACTIVE", role: acc.role },
      create: {
        id: acc.id,
        email: acc.email,
        nama: acc.nama,
        role: acc.role,
        status: "ACTIVE",
        passwordHash: acc.hash,
        emailVerifiedAt: new Date(),
      },
    });
  }

  const gedung = await prisma.gedung.upsert({
    where: { kode: "GA" },
    update: {},
    create: { kode: "GA", nama: "Gedung A" },
  });

  const ruanganList = await Promise.all([
    prisma.ruangan.upsert({
      where: { kodeRuangan: "R201" },
      update: {},
      create: {
        kodeRuangan: "R201",
        namaRuangan: "Ruang Kelas 201",
        tipe: TipeRuangan.KELAS,
        lantai: 2,
        gedungId: gedung.id,
      },
    }),
    prisma.ruangan.upsert({
      where: { kodeRuangan: "R202" },
      update: {},
      create: {
        kodeRuangan: "R202",
        namaRuangan: "Ruang Kelas 202",
        tipe: TipeRuangan.KELAS,
        lantai: 2,
        gedungId: gedung.id,
      },
    }),
    prisma.ruangan.upsert({
      where: { kodeRuangan: "LAB-NET" },
      update: {},
      create: {
        kodeRuangan: "LAB-NET",
        namaRuangan: "Laboratorium Jaringan",
        tipe: TipeRuangan.LABORATORIUM,
        lantai: 3,
        gedungId: gedung.id,
      },
    }),
  ]);
  const [r201, r202, labNet] = ruanganList;

  // Assign PJ_RUANG ke R201 + R202, LABORAN ke LAB-NET
  await Promise.all([
    prisma.userRuangan.upsert({
      where: { userId_ruanganId: { userId: "seed-user-pj", ruanganId: r201.id } },
      update: {},
      create: { userId: "seed-user-pj", ruanganId: r201.id },
    }),
    prisma.userRuangan.upsert({
      where: { userId_ruanganId: { userId: "seed-user-pj", ruanganId: r202.id } },
      update: {},
      create: { userId: "seed-user-pj", ruanganId: r202.id },
    }),
    prisma.userRuangan.upsert({
      where: { userId_ruanganId: { userId: "seed-user-laboran", ruanganId: labNet.id } },
      update: {},
      create: { userId: "seed-user-laboran", ruanganId: labNet.id },
    }),
  ]);

  const jenisList = await Promise.all([
    prisma.jenisBarang.upsert({ where: { kode: "MEJA" }, update: {}, create: { kode: "MEJA", nama: "Meja" } }),
    prisma.jenisBarang.upsert({ where: { kode: "KURSI" }, update: {}, create: { kode: "KURSI", nama: "Kursi" } }),
    prisma.jenisBarang.upsert({ where: { kode: "AC" }, update: {}, create: { kode: "AC", nama: "AC" } }),
    prisma.jenisBarang.upsert({ where: { kode: "KOMPUTER" }, update: {}, create: { kode: "KOMPUTER", nama: "Komputer" } }),
    prisma.jenisBarang.upsert({ where: { kode: "APAR" }, update: {}, create: { kode: "APAR", nama: "APAR" } }),
  ]);
  const [meja, kursi, ac, komputer, apar] = jenisList;

  await Promise.all([
    prisma.jadwalMaintenance.upsert({
      where: { id: "seed-jadwal-ac" },
      update: {},
      create: { id: "seed-jadwal-ac", jenisId: ac.id, intervalBulan: 3 },
    }),
    prisma.jadwalMaintenance.upsert({
      where: { id: "seed-jadwal-apar" },
      update: {},
      create: { id: "seed-jadwal-apar", jenisId: apar.id, intervalBulan: 6 },
    }),
  ]);

  const [kategoriElektronik, kategoriMebel] = await Promise.all([
    prisma.kategoriApproval.upsert({
      where: { id: "seed-kategori-elektronik" },
      update: {},
      create: {
        id: "seed-kategori-elektronik",
        nama: "Elektronik",
        wajibApproval: true,
        deskripsi: "Barang elektronik bernilai tinggi, perlu approval saat pemindahan",
      },
    }),
    prisma.kategoriApproval.upsert({
      where: { id: "seed-kategori-mebel" },
      update: {},
      create: {
        id: "seed-kategori-mebel",
        nama: "Mebel",
        wajibApproval: false,
        deskripsi: "Perabot, pemindahan langsung tercatat tanpa approval",
      },
    }),
  ]);

  const tahun = new Date().getFullYear();

  const barangSeed: Array<{
    id: string;
    jenis: (typeof jenisList)[number];
    ruangan: (typeof ruanganList)[number];
    nomorUrut: number;
    nama: string;
    kategoriId: string;
    penguasaan: string;
  }> = [
    { id: "seed-barang-meja-r201-1", jenis: meja, ruangan: r201, nomorUrut: 1, nama: "Meja Kerja", kategoriId: kategoriMebel.id, penguasaan: "Prodi Informatika" },
    { id: "seed-barang-kursi-r201-1", jenis: kursi, ruangan: r201, nomorUrut: 1, nama: "Kursi Kuliah", kategoriId: kategoriMebel.id, penguasaan: "Prodi Informatika" },
    { id: "seed-barang-ac-r202-1", jenis: ac, ruangan: r202, nomorUrut: 1, nama: "AC Split 1 PK", kategoriId: kategoriElektronik.id, penguasaan: "Prodi Informatika" },
    { id: "seed-barang-komputer-labnet-1", jenis: komputer, ruangan: labNet, nomorUrut: 1, nama: "PC Desktop", kategoriId: kategoriElektronik.id, penguasaan: "Laboratorium Jaringan" },
    { id: "seed-barang-apar-labnet-1", jenis: apar, ruangan: labNet, nomorUrut: 1, nama: "APAR 3kg", kategoriId: kategoriElektronik.id, penguasaan: "Laboratorium Jaringan" },
  ];

  for (const b of barangSeed) {
    const kodeBarang = `${b.jenis.kode}-${tahun}-${b.ruangan.kodeRuangan}-${String(b.nomorUrut).padStart(4, "0")}`;

    const barang = await prisma.barang.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        kodeBarang,
        namaBarang: b.nama,
        jenisId: b.jenis.id,
        tahunPembelian: tahun,
        nomorUrut: b.nomorUrut,
        lokasiTerdaftarId: b.ruangan.id,
        lokasiAktualId: b.ruangan.id,
        kategoriApprovalId: b.kategoriId,
        penguasaan: b.penguasaan,
      },
    });

    await prisma.qrCode.upsert({
      where: { id: `${b.id}-qr` },
      update: {},
      create: {
        id: `${b.id}-qr`,
        tipe: TipeQr.BARANG,
        barangId: barang.id,
        payload: JSON.stringify({
          v: 1,
          t: "barang",
          id_barang: barang.id,
          kode_barang: barang.kodeBarang,
          id_ruangan: b.ruangan.id,
          kode_ruangan: b.ruangan.kodeRuangan,
          nama_barang: barang.namaBarang,
        }),
        aktif: true,
      },
    });
  }

  for (const ruangan of ruanganList) {
    await prisma.qrCode.upsert({
      where: { id: `seed-ruangan-${ruangan.kodeRuangan}-qr` },
      update: {},
      create: {
        id: `seed-ruangan-${ruangan.kodeRuangan}-qr`,
        tipe: TipeQr.RUANGAN,
        ruanganId: ruangan.id,
        payload: JSON.stringify({
          v: 1,
          t: "ruangan",
          id_ruangan: ruangan.id,
          kode_ruangan: ruangan.kodeRuangan,
          nama_ruangan: ruangan.namaRuangan,
        }),
        aktif: true,
      },
    });
  }

  await prisma.konfigurasiLabel.upsert({
    where: { id: "seed-konfigurasi-label" },
    update: {},
    create: { id: "seed-konfigurasi-label" },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
