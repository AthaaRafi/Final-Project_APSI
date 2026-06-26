import { PrismaClient, TipeRuangan, TipeQr, Role, StatusUser, Kondisi, StatusBarang, FlagVerifikasi, JenisPengajuan, StatusPengajuan, StatusOpname, StatusMatching, SumberPenghapusan, TipeNotifikasi } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();
const RESET = process.argv.includes("--reset");

// ── Konstanta volume (tweak di sini) ─────────────────────────────
const NUM_GEDUNG = 6;
const NUM_RUANGAN = 150;
const TARGET_BARANG = 10_000;
const NUM_USERS = 60;
const NUM_PENGAJUAN = 800;
const NUM_OPNAME = 120;
const NUM_NOTIFIKASI = 1500;
const NUM_AUDIT = 2000;
const BATCH_SIZE = 1000;

const DUMMY_PASSWORD_HASH = "$2b$10$E54L7RM/.czJWtMiwc256.scooPLPyYkgxXiVQugMzp8w0hOyiEhq"; // dummy123 = same as admin123

// ── Helpers ──────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(yearStart: number, yearEnd: number) {
  const start = new Date(yearStart, 0, 1).getTime();
  const end = new Date(yearEnd, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}
function did(prefix: string, n: number) { return `dummy-${prefix}-${String(n).padStart(5, "0")}`; }

async function batchCreate<T extends Record<string, unknown>>(table: string, rows: T[]) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[table].createMany({ data: batch, skipDuplicates: true });
  }
}

// ── 0. Reset ─────────────────────────────────────────────────────
async function resetDummy() {
  console.log("🗑  Menghapus data dummy...");
  // Delete in reverse FK order
  await prisma.notifikasi.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.auditLog.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.logCetakLabel.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.stockOpnameDetail.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.stockOpname.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.riwayatBarang.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.lampiran.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.pengajuan.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.qrCode.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.barang.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.userRuangan.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.ruangan.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.gedung.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.jenisBarang.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  await prisma.jadwalMaintenance.deleteMany({ where: { id: { startsWith: "dummy-" } } });
  console.log("✅ Data dummy dihapus.");
}

// ── 1. Jenis Barang ──────────────────────────────────────────────
const JENIS_DEFS = [
  { kode: "MEJA", nama: "Meja" },
  { kode: "KURSI", nama: "Kursi" },
  { kode: "AC", nama: "AC" },
  { kode: "KOMPUTER", nama: "Komputer" },
  { kode: "APAR", nama: "APAR" },
  { kode: "PROYEKTOR", nama: "Proyektor" },
  { kode: "PRINTER", nama: "Printer" },
  { kode: "LEMARI", nama: "Lemari" },
  { kode: "WHITEBOARD", nama: "Whiteboard" },
  { kode: "ROUTER", nama: "Router" },
  { kode: "SWITCH", nama: "Switch Jaringan" },
  { kode: "GENSET", nama: "Generator Set" },
];

const ELEKTRONIK_KODES = ["AC", "KOMPUTER", "PROYEKTOR", "PRINTER", "ROUTER", "SWITCH", "GENSET"];

async function ensureJenis() {
  console.log("📦 Memastikan 12 jenis barang...");
  const existing = await prisma.jenisBarang.findMany();
  const existingKodes = new Set(existing.map(j => j.kode));
  const toCreate = JENIS_DEFS.filter(j => !existingKodes.has(j.kode)).map((j, i) => ({
    id: did("jenis", i),
    kode: j.kode,
    nama: j.nama,
  }));
  if (toCreate.length > 0) await prisma.jenisBarang.createMany({ data: toCreate, skipDuplicates: true });
  return prisma.jenisBarang.findMany();
}

// ── 2. Gedung & Ruangan ──────────────────────────────────────────
async function generateGedungRuangan() {
  console.log("🏢 Membuat 6 gedung & 150 ruangan...");
  const gedungLetters = ["A", "B", "C", "D", "E", "F"];
  const gedungRows = gedungLetters.map((l, i) => ({
    id: did("gedung", i),
    kode: `G${l}`,
    nama: `Gedung ${l}`,
  }));
  await prisma.gedung.createMany({ data: gedungRows, skipDuplicates: true });
  const gedungs = await prisma.gedung.findMany({ where: { id: { startsWith: "dummy-" } } });

  const ruanganRows: Array<{
    id: string; kodeRuangan: string; namaRuangan: string;
    tipe: TipeRuangan; lantai: number; gedungId: string;
  }> = [];
  let ruanganCounter = 0;
  const perGedung = Math.ceil(NUM_RUANGAN / gedungs.length);

  for (const g of gedungs) {
    const letter = g.kode.replace("G", "");
    for (let r = 0; r < perGedung && ruanganCounter < NUM_RUANGAN; r++) {
      const lantai = (r % 4) + 1;
      const isLab = Math.random() < 0.3;
      const nomor = String(r + 1).padStart(2, "0");
      const kode = isLab ? `LAB-${letter}${nomor}` : `R${letter}${lantai}${nomor}`;
      ruanganRows.push({
        id: did("ruangan", ruanganCounter),
        kodeRuangan: kode,
        namaRuangan: isLab ? `Lab ${faker.science.chemicalElement().name} ${nomor}` : `Ruang ${letter}${lantai}${nomor}`,
        tipe: isLab ? TipeRuangan.LABORATORIUM : TipeRuangan.KELAS,
        lantai,
        gedungId: g.id,
      });
      ruanganCounter++;
    }
  }
  await batchCreate("ruangan", ruanganRows);
  return prisma.ruangan.findMany({ where: { id: { startsWith: "dummy-" } } });
}

// ── 3. Users & UserRuangan ───────────────────────────────────────
async function generateUsers(ruangans: { id: string }[]) {
  console.log("👥 Membuat 60 akun & penugasan ruangan...");
  const roleDist: Array<{ role: Role; count: number; emailDomain: string }> = [
    { role: "INVENTARIS", count: 1, emailDomain: "@staff.uns.ac.id" },
    { role: "PIMPINAN", count: 3, emailDomain: "@staff.uns.ac.id" },
    { role: "PJ_RUANG", count: 25, emailDomain: "@staff.uns.ac.id" },
    { role: "LABORAN", count: 15, emailDomain: "@staff.uns.ac.id" },
    { role: "PENGGUNA", count: 16, emailDomain: "@student.uns.ac.id" },
  ];

  const userRows: Array<{
    id: string; email: string; passwordHash: string; nama: string;
    role: Role; status: StatusUser; emailVerifiedAt: Date;
  }> = [];
  let userIdx = 0;
  for (const rd of roleDist) {
    for (let i = 0; i < rd.count; i++) {
      userRows.push({
        id: did("user", userIdx),
        email: `dummy${userIdx + 1}${rd.emailDomain}`,
        passwordHash: DUMMY_PASSWORD_HASH,
        nama: faker.person.fullName(),
        role: rd.role,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      });
      userIdx++;
    }
  }
  await batchCreate("user", userRows);

  // Assign PJ_RUANG & LABORAN to rooms (round-robin, no overlap)
  const pjLabUsers = userRows.filter(u => u.role === "PJ_RUANG" || u.role === "LABORAN");
  const urRows: Array<{ id: string; userId: string; ruanganId: string }> = [];
  let roomIdx = 0;
  for (const u of pjLabUsers) {
    const assignCount = randInt(2, 5);
    for (let a = 0; a < assignCount && roomIdx < ruangans.length; a++) {
      urRows.push({
        id: did("ur", roomIdx),
        userId: u.id,
        ruanganId: ruangans[roomIdx].id,
      });
      roomIdx++;
    }
  }
  await batchCreate("userRuangan", urRows);

  // Assign akun dev PJ (seed-user-pj) & Laboran (seed-user-laboran) ke beberapa ruangan dummy
  // agar bisa demo cetak label & lihat barang dummy saat login dev
  const devAssignCount = Math.min(5, ruangans.length);
  const devUrRows: Array<{ id: string; userId: string; ruanganId: string }> = [];
  for (let i = 0; i < devAssignCount; i++) {
    devUrRows.push({
      id: did("ur-dev-pj", i),
      userId: "seed-user-pj",
      ruanganId: ruangans[i].id,
    });
  }
  for (let i = 0; i < devAssignCount; i++) {
    devUrRows.push({
      id: did("ur-dev-lab", i),
      userId: "seed-user-laboran",
      ruanganId: ruangans[devAssignCount + i < ruangans.length ? devAssignCount + i : i].id,
    });
  }
  await batchCreate("userRuangan", devUrRows);
  console.log(`   ✅ Akun dev PJ & Laboran di-assign ke ${devAssignCount} ruangan dummy masing-masing.`);

  return userRows;
}

// ── 4. Barang ────────────────────────────────────────────────────
const PENGUASAAN = [
  "Prodi Informatika", "Prodi Sistem Informasi", "Prodi Teknik Elektro",
  "Prodi Teknik Mesin", "Prodi Teknik Sipil", "Prodi Arsitektur",
  "Bagian Umum", "Dekanat", "UPT TIK", "Laboratorium Terpadu",
];

const NAMA_BARANG: Record<string, string[]> = {
  MEJA: ["Meja Kerja", "Meja Dosen", "Meja Kuliah", "Meja Rapat", "Meja Komputer"],
  KURSI: ["Kursi Kuliah", "Kursi Dosen", "Kursi Rapat", "Kursi Lipat", "Kursi Putar"],
  AC: ["AC Split 1 PK", "AC Split 1.5 PK", "AC Split 2 PK", "AC Standing 5 PK"],
  KOMPUTER: ["PC Desktop", "PC All-in-One", "Laptop", "Mini PC", "Workstation"],
  APAR: ["APAR 3kg CO2", "APAR 5kg Powder", "APAR 6kg Foam"],
  PROYEKTOR: ["Proyektor LCD", "Proyektor DLP", "Proyektor Laser"],
  PRINTER: ["Printer LaserJet", "Printer InkJet", "Printer Dot Matrix", "Printer Label"],
  LEMARI: ["Lemari Arsip", "Lemari Besi", "Lemari Kaca", "Locker 6 Pintu"],
  WHITEBOARD: ["Whiteboard 120x80", "Whiteboard 240x120", "Whiteboard Portable"],
  ROUTER: ["Router WiFi", "Router Enterprise", "Access Point"],
  SWITCH: ["Switch 24 Port", "Switch 48 Port", "Switch PoE"],
  GENSET: ["Genset 5 kVA", "Genset 10 kVA", "Genset 25 kVA"],
};

async function generateBarang(
  ruangans: Array<{ id: string; kodeRuangan: string }>,
  jenisList: Array<{ id: string; kode: string }>,
  kategoriElekId: string,
  kategoriMebelId: string,
) {
  console.log(`📋 Membuat ~${TARGET_BARANG} barang...`);
  const kondisiDist: Kondisi[] = ["BAIK", "BAIK", "BAIK", "BAIK", "BAIK", "RUSAK_RINGAN", "RUSAK_RINGAN", "RUSAK_RINGAN", "RUSAK_BERAT", "RUSAK_BERAT"];
  const statusDist: StatusBarang[] = [
    "NORMAL", "NORMAL", "NORMAL", "NORMAL",
    "DILAPORKAN_RUSAK", "MENUNGGU_VALIDASI", "DALAM_PERAWATAN",
    "TERJADWAL_PERAWATAN", "HILANG", "DIAJUKAN_HAPUS", "NONAKTIF",
  ];
  const flagDist: FlagVerifikasi[] = ["BELUM", "BELUM", "TERVERIFIKASI", "TERVERIFIKASI", "TERVERIFIKASI", "ANOMALI"];

  const nomorUrutMap = new Map<string, number>();
  const barangRows: Array<Record<string, unknown>> = [];
  let barangIdx = 0;
  const perRoom = Math.ceil(TARGET_BARANG / ruangans.length);

  for (const room of ruangans) {
    const count = randInt(Math.max(1, perRoom - 25), perRoom + 25);
    for (let b = 0; b < count && barangIdx < TARGET_BARANG; b++) {
      const jenis = pick(jenisList);
      const tahun = randInt(2018, 2025);
      const key = `${jenis.kode}-${room.kodeRuangan}-${tahun}`;
      const nr = (nomorUrutMap.get(key) ?? 0) + 1;
      nomorUrutMap.set(key, nr);
      const kode = `${jenis.kode}-${tahun}-${room.kodeRuangan}-${String(nr).padStart(4, "0")}`;

      const isElektronik = ELEKTRONIK_KODES.includes(jenis.kode);
      const lokasiAnomal = Math.random() < 0.1;
      const lokasiAktualId = lokasiAnomal ? pick(ruangans).id : room.id;

      barangRows.push({
        id: did("barang", barangIdx),
        kodeBarang: kode,
        namaBarang: pick(NAMA_BARANG[jenis.kode] ?? [`${jenis.kode} Unit`]),
        jenisId: jenis.id,
        tahunPembelian: tahun,
        nomorUrut: nr,
        lokasiTerdaftarId: room.id,
        lokasiAktualId,
        kondisi: pick(kondisiDist),
        statusBarang: pick(statusDist),
        flagVerifikasi: pick(flagDist),
        kategoriApprovalId: isElektronik ? kategoriElekId : kategoriMebelId,
        penguasaan: pick(PENGUASAAN),
        createdBy: "seed-user-inventaris",
      });
      barangIdx++;
    }
  }
  await batchCreate("barang", barangRows);
  console.log(`   ✅ ${barangRows.length} barang dibuat.`);
  return barangRows as Array<{ id: string; kodeBarang: string; namaBarang: string; lokasiTerdaftarId: string }>;
}

// ── 5. QR Code ───────────────────────────────────────────────────
async function generateQr(
  barangs: Array<{ id: string; kodeBarang: string; namaBarang: string; lokasiTerdaftarId: string }>,
  ruangans: Array<{ id: string; kodeRuangan: string; namaRuangan?: string }>,
) {
  console.log("📱 Membuat QR Code...");
  const qrBarang = barangs.map((b, i) => ({
    id: did("qrb", i),
    tipe: TipeQr.BARANG,
    barangId: b.id,
    payload: JSON.stringify({ v: 1, t: "barang", id_barang: b.id, kode_barang: b.kodeBarang, nama_barang: b.namaBarang }),
    aktif: true,
  }));
  await batchCreate("qrCode", qrBarang);

  const qrRuangan = ruangans.map((r, i) => ({
    id: did("qrr", i),
    tipe: TipeQr.RUANGAN,
    ruanganId: r.id,
    payload: JSON.stringify({ v: 1, t: "ruangan", id_ruangan: r.id, kode_ruangan: r.kodeRuangan }),
    aktif: true,
  }));
  await batchCreate("qrCode", qrRuangan);
  console.log(`   ✅ ${qrBarang.length} QR barang + ${qrRuangan.length} QR ruangan.`);
}

// ── 6. Pengajuan ─────────────────────────────────────────────────
async function generatePengajuan(
  barangs: Array<{ id: string; lokasiTerdaftarId: string }>,
  users: Array<{ id: string; role: Role }>,
  ruangans: Array<{ id: string }>,
) {
  console.log(`📝 Membuat ~${NUM_PENGAJUAN} pengajuan...`);
  const jenisDist: JenisPengajuan[] = ["PEMINDAHAN", "PEMINDAHAN", "KERUSAKAN", "KERUSAKAN", "KERUSAKAN", "PENGHAPUSAN"];
  const statusAll: StatusPengajuan[] = ["MENUNGGU", "DISETUJUI", "DITOLAK", "REVISI", "SELESAI", "LANGSUNG_TERCATAT", "DIBATALKAN"];
  const sumberAll: SumberPenghapusan[] = ["LAPORAN_KERUSAKAN", "STOCK_OPNAME", "MANUAL"];
  const pengajuCandidates = users.filter(u => ["PENGGUNA", "PJ_RUANG", "LABORAN"].includes(u.role));

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < NUM_PENGAJUAN; i++) {
    const jenis = pick(jenisDist);
    const barang = pick(barangs);
    const status = pick(statusAll);
    const pengaju = pick(pengajuCandidates);

    const row: Record<string, unknown> = {
      id: did("pgj", i),
      nomor: `PGJ-2025-${String(i + 1).padStart(5, "0")}`,
      jenis,
      barangId: barang.id,
      pengajuId: pengaju.id,
      alasan: faker.lorem.sentence(),
      status,
      createdAt: randDate(2024, 2025),
    };

    if (jenis === "PEMINDAHAN") {
      row.lokasiAsalId = barang.lokasiTerdaftarId;
      row.lokasiTujuanId = pick(ruangans).id;
      row.isAntarArea = Math.random() < 0.3;
    }
    if (jenis === "PENGHAPUSAN") {
      row.sumber = pick(sumberAll);
    }
    if (["DISETUJUI", "DITOLAK", "REVISI"].includes(status)) {
      row.catatanAdmin = faker.lorem.sentence();
    }
    rows.push(row);
  }
  await batchCreate("pengajuan", rows);
  console.log(`   ✅ ${rows.length} pengajuan.`);
}

// ── 7. Riwayat Barang ────────────────────────────────────────────
async function generateRiwayat(barangs: Array<{ id: string }>) {
  console.log("📜 Membuat riwayat barang...");
  const rows: Array<Record<string, unknown>> = [];
  const count = Math.min(3000, barangs.length);
  for (let i = 0; i < count; i++) {
    rows.push({
      id: did("riwayat", i),
      barangId: barangs[i].id,
      aktivitas: "Barang ditambahkan ke sistem",
      aktor: "seed-user-inventaris",
      waktu: randDate(2023, 2025),
    });
  }
  await batchCreate("riwayatBarang", rows);
  console.log(`   ✅ ${rows.length} riwayat.`);
}

// ── 8. Stock Opname ──────────────────────────────────────────────
async function generateStockOpname(
  ruangans: Array<{ id: string }>,
  barangs: Array<{ id: string; kodeBarang: string; lokasiTerdaftarId: string }>,
  users: Array<{ id: string; role: Role }>,
) {
  console.log(`🔍 Membuat ~${NUM_OPNAME} sesi stock opname...`);
  const admins = users.filter(u => ["INVENTARIS", "PJ_RUANG", "LABORAN"].includes(u.role));

  // Create opname sessions
  const opnameRows: Array<Record<string, unknown>> = [];
  const detailAllRows: Array<Record<string, unknown>> = [];
  let detailIdx = 0;

  for (let i = 0; i < NUM_OPNAME && i < ruangans.length; i++) {
    const ruangan = ruangans[i];
    const status: StatusOpname = i < NUM_OPNAME - 5 ? "SELESAI" : "AKTIF";
    const tanggal = randDate(2024, 2025);

    // Find barang in this room
    const roomBarangs = barangs.filter(b => b.lokasiTerdaftarId === ruangan.id);
    let cocok = 0, tidakCocok = 0, tidakTerdaftar = 0, hilang = 0;

    // Generate details for this session
    for (const b of roomBarangs) {
      const matching = pickWeighted<StatusMatching>(
        ["COCOK", "TIDAK_COCOK", "TIDAK_TERDAFTAR"],
        [70, 20, 10],
      );
      if (matching === "COCOK") cocok++;
      else if (matching === "TIDAK_COCOK") tidakCocok++;
      else tidakTerdaftar++;

      detailAllRows.push({
        id: did("opdet", detailIdx),
        opnameId: did("opname", i),
        kodeBarangScan: b.kodeBarang,
        barangId: b.id,
        statusMatching: matching,
        keterangan: matching !== "COCOK" ? faker.lorem.sentence() : null,
        ruanganAktualId: matching === "TIDAK_COCOK" ? pick(ruangans).id : null,
        waktuScan: new Date(tanggal.getTime() + detailIdx * 5000),
      });
      detailIdx++;
    }

    // Some "hilang" = baseline items not scanned (simulate by counting)
    hilang = Math.floor(roomBarangs.length * 0.05);

    opnameRows.push({
      id: did("opname", i),
      tahunAnggaran: 2025,
      ruanganId: ruangan.id,
      adminId: pick(admins).id,
      tanggalScan: tanggal,
      waktuSelesai: status === "SELESAI" ? new Date(tanggal.getTime() + 3600000) : null,
      status,
      jumlahBarangScan: roomBarangs.length,
      jumlahCocok: cocok,
      jumlahTidakCocok: tidakCocok,
      jumlahTidakTerdaftar: tidakTerdaftar,
      jumlahHilang: hilang,
    });
  }

  await batchCreate("stockOpname", opnameRows);
  console.log(`   ✅ ${opnameRows.length} sesi opname.`);
  await batchCreate("stockOpnameDetail", detailAllRows);
  console.log(`   ✅ ${detailAllRows.length} detail opname.`);
}

// ── 9. Notifikasi, Audit, Jadwal, LogCetak ───────────────────────
async function generateMisc(
  users: Array<{ id: string }>,
  ruangans: Array<{ id: string }>,
  jenisList: Array<{ id: string; kode: string }>,
) {
  console.log("🔔 Membuat notifikasi, audit log, jadwal, log cetak...");

  // Notifikasi
  const tipeAll = Object.values(TipeNotifikasi);
  const notifRows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < NUM_NOTIFIKASI; i++) {
    notifRows.push({
      id: did("notif", i),
      userId: pick(users).id,
      tipe: pick(tipeAll),
      pesan: faker.lorem.sentence(),
      dibaca: Math.random() < 0.4,
      createdAt: randDate(2024, 2025),
    });
  }
  await batchCreate("notifikasi", notifRows);
  console.log(`   ✅ ${notifRows.length} notifikasi.`);

  // Audit Log
  const auditRows: Array<Record<string, unknown>> = [];
  const aksiList = ["CREATE", "UPDATE"];
  const entitasList = ["Barang", "Pengajuan", "User", "Ruangan", "StockOpname"];
  for (let i = 0; i < NUM_AUDIT; i++) {
    auditRows.push({
      id: did("audit", i),
      aktor: pick(users).id,
      aksi: pick(aksiList),
      entitas: pick(entitasList),
      detail: faker.lorem.sentence(),
      waktu: randDate(2024, 2025),
    });
  }
  await batchCreate("auditLog", auditRows);
  console.log(`   ✅ ${auditRows.length} audit log.`);

  // Jadwal Maintenance
  const maintenanceJenis = jenisList.filter(j => ["AC", "APAR", "GENSET", "KOMPUTER", "PROYEKTOR", "PRINTER"].includes(j.kode));
  const jadwalRows = maintenanceJenis.map((j, i) => ({
    id: did("jadwal", i),
    jenisId: j.id,
    intervalBulan: pick([1, 3, 6, 12]),
    nextDueDate: randDate(2025, 2026),
    createdBy: "seed-user-inventaris",
  }));
  await batchCreate("jadwalMaintenance", jadwalRows);
  console.log(`   ✅ ${jadwalRows.length} jadwal maintenance.`);

  // Log Cetak Label
  const cetakRows = ruangans.map((r, i) => ({
    id: did("cetak", i),
    ruanganId: r.id,
    adminId: "seed-user-inventaris",
    jumlahLabel: randInt(5, 50),
    status: "SELESAI",
    tanggal: randDate(2024, 2025),
  }));
  await batchCreate("logCetakLabel", cetakRows);
  console.log(`   ✅ ${cetakRows.length} log cetak label.`);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Seed Dummy — Inventaris Fakultas");
  console.log(`   Target: ${NUM_GEDUNG} gedung · ${NUM_RUANGAN} ruangan · ${TARGET_BARANG} barang · ${NUM_USERS} akun\n`);

  if (RESET) {
    await resetDummy();
    console.log("");
  }

  // 1. Jenis barang
  const jenisList = await ensureJenis();

  // 2. Gedung & Ruangan
  const ruangans = await generateGedungRuangan();

  // 3. Users
  const users = await generateUsers(ruangans);

  // 4. Get kategori IDs (from existing seed)
  const katElektronik = await prisma.kategoriApproval.findFirst({ where: { nama: "Elektronik" } });
  const katMebel = await prisma.kategoriApproval.findFirst({ where: { nama: "Mebel" } });
  if (!katElektronik || !katMebel) {
    throw new Error("Kategori Approval 'Elektronik' & 'Mebel' belum ada. Jalankan `npx prisma db seed` terlebih dahulu.");
  }

  // 5. Barang
  const barangs = await generateBarang(
    ruangans.map(r => ({ id: r.id, kodeRuangan: r.kodeRuangan })),
    jenisList.map(j => ({ id: j.id, kode: j.kode })),
    katElektronik.id,
    katMebel.id,
  );

  // 6. QR Code
  await generateQr(
    barangs,
    ruangans.map(r => ({ id: r.id, kodeRuangan: r.kodeRuangan })),
  );

  // 7. Pengajuan
  await generatePengajuan(barangs, users, ruangans);

  // 8. Riwayat
  await generateRiwayat(barangs);

  // 9. Stock Opname
  await generateStockOpname(
    ruangans,
    barangs.map(b => ({ id: b.id, kodeBarang: b.kodeBarang, lokasiTerdaftarId: b.lokasiTerdaftarId })),
    users,
  );

  // 10. Notifikasi, Audit, Jadwal, LogCetak
  await generateMisc(users, ruangans, jenisList);

  console.log("\n🎉 Seed dummy selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
