# SDD

# SDD — System Design Document

> **Status:** Update v1.2 (sinkron model 5 role, FA-11, kondisi/status barang & maintenance preventif) · **Tanggal:** 9 Juni 2026
**Stack:** Next.js (App Router) fullstack · TypeScript · MySQL 8 · Prisma · JWT (httpOnly cookie).
**Dokumen terkait:** [`PRD.md`](./PRD.md) · [`SRS.md`](./SRS.md) · [`RULES.md`](./RULES.md) · [`AGENTS.md`](../AGENTS.md)
> 

SDD ini adalah **acuan teknis**: arsitektur, struktur folder, desain database, desain API, auth, penyimpanan file, QR/label. Semua aturan bisnis yang diimplementasikan di sini bersumber dari **SRS**.

---

## 1. Tech Stack

| Lapisan | Pilihan | Catatan |
| --- | --- | --- |
| Framework | **Next.js (App Router)**, versi stabil terbaru | Frontend + backend (Route Handlers) satu repo |
| Bahasa | **TypeScript** (strict) | Wajib `strict: true` |
| Runtime | Node.js LTS (≥ 20) |  |
| Database | **MySQL 8.x** |  |
| ORM | **Prisma** | Migrasi & query type-safe |
| Auth | **JWT** via `jose` di cookie httpOnly + **bcrypt** | RBAC 5 role: PENGGUNA/PJ_RUANG/LABORAN/INVENTARIS/PIMPINAN |
| Validasi | **Zod** | Schema dipakai bersama client & server |
| UI | **Tailwind CSS + shadcn/ui** | `lucide-react` ikon, `sonner` toast |
| Data fetching (client) | **TanStack Query** (React Query) | Cache + invalidation terpusat |
| Tabel | **TanStack Table** (lewat shadcn data-table) |  |
| QR generate | `qrcode` | Saat barang dibuat/import |
| QR scan | `html5-qrcode` | Kamera HP/laptop |
| Label/PDF (MVP) | Halaman cetak HTML + CSS `@media print` | Ctrl+P → Save as PDF |
| File storage | Disk lokal via lapisan `lib/storage` | Siap diganti S3/Cloudinary |
| Excel export | `exceljs` (atau `xlsx`) | Tahap 2 untuk export kaya |
| Package manager | npm |  |

> **Versi tidak di-pin keras di dokumen** agar tidak cepat usang. Saat `init`, pakai versi stabil terbaru; kunci versi di `package.json`/lockfile.
> 

---

## 2. Arsitektur Aplikasi

Aplikasi memakai **layered architecture** dalam satu proyek Next.js. Sumber kebenaran perilaku ada di **Service layer (server)**.

```
Browser (User/Admin)
   │  fetch (React Query) / form
   ▼
Next.js Route Handlers  ──  app/api/**/route.ts   (lapisan "controller": parsing, auth, validasi, panggil service)
   ▼
Service layer           ──  src/server/services/*  (aturan bisnis dari SRS, orkestrasi, transaksi)
   ▼
Repository layer        ──  src/server/repositories/*  (akses data via Prisma)
   ▼
Prisma Client  ──►  MySQL
```

Prinsip:
- **Route Handler tipis**: hanya auth + validasi + delegasi ke service. Tidak ada aturan bisnis di sini.
- **Service = satu-satunya tempat aturan bisnis** (SRS). Validasi lintas entitas, transaksi, audit.
- **Repository = satu-satunya tempat query DB** (Prisma). Tidak ada query Prisma tersebar di komponen/route.
- **Frontend tidak menegakkan aturan bisnis**; ia hanya konsumen API + UX.

> Server Actions boleh dipakai untuk mutasi sederhana, tapi **pola utama API memakai Route Handlers** agar kontrak jelas dan mudah diuji (sesuai filosofi `contoh.md`).
> 

---

## 3. Struktur Folder Proyek (greenfield)

```
inventaris-fakultas/
├─ prisma/
│  ├─ schema.prisma          # model database (source of truth schema)
│  ├─ migrations/            # migrasi forward-only
│  └─ seed.ts                # data awal: master contoh (akun Inventaris via Setup Wizard)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/            # publik: login, sign up, verifikasi, lupa password, setup
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  ├─ verify/page.tsx
│  │  │  ├─ forgot/page.tsx
│  │  │  └─ setup/page.tsx   # bootstrap INVENTARIS pertama (DB kosong)
│  │  ├─ (pelapor)/          # role PENGGUNA (Civitas)
│  │  │  ├─ dashboard/
│  │  │  ├─ barang/          # lihat barang & status
│  │  │  ├─ pengajuan/       # lapor & ajukan pemindahan
│  │  │  └─ layout.tsx       # shell pelapor
│  │  ├─ (area)/             # role PJ_RUANG & LABORAN (scope area di-assign)
│  │  │  ├─ area/            # dashboard pengelola area
│  │  │  ├─ barang/          # kelola barang area
│  │  │  ├─ approval/        # proses pengajuan area
│  │  │  ├─ scan/            # Scan Cepat (Stock Opname)
│  │  │  ├─ maintenance/     # override jadwal maintenance per unit
│  │  │  ├─ label/           # cetak QR label
│  │  │  └─ layout.tsx       # shell area
│  │  ├─ (inventaris)/       # role INVENTARIS (pusat/rekap global + FA-11)
│  │  │  ├─ inventaris/      # dashboard global
│  │  │  ├─ master/          # master ruangan/gedung/jenis (dikunci)
│  │  │  ├─ kategori-approval/
│  │  │  ├─ maintenance/     # jadwal default global per jenis
│  │  │  ├─ users/           # manajemen akun & role (FA-11)
│  │  │  ├─ laporan/         # laporan tahunan & export universitas
│  │  │  └─ layout.tsx       # shell inventaris
│  │  ├─ (supervisor)/       # role PIMPINAN (read-only global)
│  │  │  ├─ supervisor/      # dashboard pemantauan
│  │  │  └─ layout.tsx       # shell supervisor
│  │  ├─ api/                # Route Handlers (lihat §6)
│  │  ├─ layout.tsx          # root providers
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                 # shadcn primitives
│  │  ├─ data-table/         # DataTable, kolom, bulk
│  │  ├─ domain/             # komponen domain (StatusBadge, ScanFeedback, dll)
│  │  └─ layout/             # Sidebar, Topbar, Navbar
│  ├─ lib/
│  │  ├─ db.ts               # Prisma client singleton
│  │  ├─ auth/               # jwt.ts, session.ts, password.ts, rbac.ts
│  │  ├─ api/                # client.ts (fetch helper), query-keys.ts
│  │  ├─ validation/         # skema Zod per domain (shared)
│  │  ├─ storage/            # index.ts (abstraksi simpan/ambil file)
│  │  ├─ qr/                 # generate.ts (qrcode)
│  │  └─ utils.ts
│  ├─ server/
│  │  ├─ services/           # barang.service.ts, pengajuan.service.ts, scan.service.ts, ...
│  │  └─ repositories/       # barang.repo.ts, ruangan.repo.ts, ...
│  └─ types/                 # tipe bersama (mengikuti response API)
├─ public/
├─ storage/                  # file upload lokal (TIDAK di public; diserve via API)
│  ├─ foto/
│  └─ logo/
├─ docs/                     # PRD, SRS, SDD, UIUX_FLOW, TASK_BREAKDOWN, RULES
├─ src/proxy.ts              # guard auth + role (dulu middleware.ts, deprecated di Next 16)
├─ .env.example
├─ package.json
└─ tsconfig.json
```

> Route group `(auth)`, `(pelapor)`, `(area)`, `(inventaris)`, `(supervisor)` **tidak ikut URL**. Mis. `app/(area)/scan/page.tsx` → `/scan`.
> 

---

## 4. Desain Database (Prisma)

Konvensi: nama tabel `snake_case` (via `@@map`), nama field di kode `camelCase`. Setiap tabel domain punya **audit fields** (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) dan domain soft-delete punya `deletedAt`, `deletedBy`.

### 4.1 Diagram relasi (ringkas)

```
User >──< Ruangan        (via UserRuangan: PJ Ruang/Laboran ↔ ruang/lab, M2M)
Ruangan ──< Barang >── JenisBarang
Barang >── KategoriApproval
Barang ──< Pengajuan >── User (pengaju)
Barang ──< RiwayatBarang
Barang ──< Lampiran ; Pengajuan ──< Lampiran
Ruangan ──< StockOpname >── User (admin)
StockOpname ──< StockOpnameDetail >── Barang (nullable)
KonfigurasiLabel (1 baris global) ; LogCetakLabel >── Ruangan, User
```

### 4.2 Skema Prisma (kerangka — sesuaikan saat implementasi)

```
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"; url = env("DATABASE_URL") }

enum Role { PENGGUNA PJ_RUANG LABORAN INVENTARIS PIMPINAN }
enum StatusUser { PENDING_VERIFICATION ACTIVE INACTIVE }
enum TipeRuangan { KELAS LABORATORIUM }
enum Kondisi { BAIK RUSAK_RINGAN RUSAK_BERAT }
enum StatusBarang { NORMAL DILAPORKAN_RUSAK MENUNGGU_VALIDASI DALAM_PERAWATAN TERJADWAL_PERAWATAN HILANG DIAJUKAN_HAPUS NONAKTIF }
enum FlagVerifikasi { BELUM TERVERIFIKASI ANOMALI }
enum JenisPengajuan { PEMINDAHAN PEMELIHARAAN KERUSAKAN PENGHAPUSAN }
enum StatusPengajuan { MENUNGGU DISETUJUI DITOLAK REVISI SELESAI LANGSUNG_TERCATAT DIBATALKAN }
enum StatusOpname { AKTIF SELESAI BATAL }
enum StatusMatching { COCOK TIDAK_COCOK TIDAK_TERDAFTAR }
enum TipeQr { BARANG RUANGAN }
enum SumberPenghapusan { LAPORAN_KERUSAKAN STOCK_OPNAME MANUAL }
enum TipeNotifikasi { PENGAJUAN_DISETUJUI PENGAJUAN_DITOLAK PENGAJUAN_SELESAI PENGAJUAN_REVISI PENGAJUAN_DIBATALKAN LAPORAN_BARU LAPORAN_DIPROSES LAPORAN_DITOLAK LAPORAN_SELESAI PENGAJUAN_BARU PENGHAPUSAN_BARU MAINTENANCE_JATUH_TEMPO }

model User {
  id              String   @id @default(cuid())
  email           String   @unique            // email kampus UNS (*.uns.ac.id)
  passwordHash    String
  nama            String
  role            Role     @default(PENGGUNA)
  status          StatusUser @default(PENDING_VERIFICATION)
  emailVerifiedAt DateTime?
  areas           UserRuangan[]                // assignment area (PJ Ruang/Laboran)
  pengajuan       Pengajuan[] @relation("Pengaju")
  sesiScan        StockOpname[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@map("user")
}

model UserRuangan {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  ruanganId String
  ruangan   Ruangan  @relation(fields: [ruanganId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, ruanganId])
  @@map("user_ruangan")
}

model Gedung {
  id       String    @id @default(cuid())
  kode     String    @unique
  nama     String
  ruangan  Ruangan[]
  @@map("gedung")
}

model Ruangan {
  id        String   @id @default(cuid())
  kodeRuangan String  @unique @map("kode_ruangan")  // dipakai di kode barang (R201)
  namaRuangan String  @map("nama_ruangan")
  tipe      TipeRuangan @default(KELAS)  // KELAS → PJ Ruang, LABORATORIUM → Laboran
  lantai    Int?              // nomor lantai (angka kecil; hindari varchar)
  gedungId  String
  gedung    Gedung   @relation(fields: [gedungId], references: [id])
  penanggungJawab UserRuangan[]          // PJ Ruang/Laboran (M2M)
  barang    Barang[]
  sesiScan  StockOpname[]
  qr        QrCode[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("ruangan")
}

model JenisBarang {
  id      String   @id @default(cuid())
  kode    String   @unique              // dipakai di kode barang (MEJA)
  nama    String
  barang  Barang[]
  @@map("jenis_barang")
}

model KategoriApproval {
  id            String   @id @default(cuid())
  nama          String
  wajibApproval Boolean  @default(false)
  deskripsi     String?
  barang        Barang[]
  @@map("kategori_approval")
}

model Barang {
  id                 String        @id @default(cuid())
  kodeBarang         String        @unique
  namaBarang         String
  jenisId            String
  jenis              JenisBarang   @relation(fields: [jenisId], references: [id])
  tahunPembelian     Int
  nomorUrut          Int
  lokasiTerdaftarId  String
  lokasiTerdaftar    Ruangan       @relation(fields: [lokasiTerdaftarId], references: [id])
  lokasiAktualId     String
  // catatan: relasi ganda ke Ruangan butuh nama relasi berbeda saat implementasi
  kondisi            Kondisi       @default(BAIK)  // kolom terpisah dari statusBarang; diperbarui dari verifikasi laporan, stock opname, atau koreksi manual (audit via RiwayatBarang/AuditLog)
  statusBarang       StatusBarang  @default(NORMAL)
  flagVerifikasi     FlagVerifikasi @default(BELUM)  // di-reset ke BELUM tiap awal tahun anggaran (siklus Stock Opname)
  kategoriApprovalId String
  kategoriApproval   KategoriApproval @relation(fields: [kategoriApprovalId], references: [id])
  penguasaan         String        // unit/prodi penguasa barang (mis. "Prodi Informatika")
  qr                 QrCode[]       // QR sebagai entitas terpisah (1 aktif + riwayat)
  fotoPath           String?
  pengajuan          Pengajuan[]
  riwayat            RiwayatBarang[]
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  createdBy          String?
  updatedBy          String?
  deletedAt          DateTime?
  deletedBy          String?
  @@index([lokasiAktualId])
  @@index([statusBarang])
  @@map("barang")
}

model QrCode {
  id        String   @id @default(cuid())
  tipe      TipeQr   @default(BARANG)   // BARANG → relasi barang; RUANGAN → relasi ruangan
  barangId  String?
  barang    Barang?  @relation(fields: [barangId], references: [id])   // diisi saat tipe BARANG
  ruanganId String?
  ruangan   Ruangan? @relation(fields: [ruanganId], references: [id])  // diisi saat tipe RUANGAN
  payload   String   @db.TinyText   // JSON final (maks 3KB, bukan varchar) — lihat §8.1
  aktif     Boolean  @default(true)  // satu QR aktif per entitas; sisanya riwayat
  createdAt DateTime @default(now())
  @@index([barangId])
  @@index([ruanganId])
  @@map("qr_code")
}

model Pengajuan {
  id            String          @id @default(cuid())
  nomor         String          @unique
  jenis         JenisPengajuan
  barangId      String
  barang        Barang          @relation(fields: [barangId], references: [id])
  pengajuId     String
  pengaju       User            @relation("Pengaju", fields: [pengajuId], references: [id])
  lokasiAsalId  String?
  lokasiTujuanId String?
  isAntarArea   Boolean         @default(false)  // true → dual-approval paralel (PMD-07)
  approvalAsalBy   String?                        // PJ area asal menyetujui (urutan bebas)
  approvalTujuanBy String?                        // PJ area tujuan menyetujui (urutan bebas)
  alasan        String          @db.Text
  sumber        SumberPenghapusan?              // khusus jenis PENGHAPUSAN: asal usulan
  sumberRefId   String?                          // referensi ke laporan/opname sumber
  status        StatusPengajuan @default(MENUNGGU)
  catatanAdmin  String?         @db.Text
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  @@index([status])
  @@map("pengajuan")
}

model RiwayatBarang {
  id        String   @id @default(cuid())
  barangId  String
  barang    Barang   @relation(fields: [barangId], references: [id])
  aktivitas String   @db.Text
  aktor     String
  waktu     DateTime @default(now())
  @@index([barangId])
  @@map("riwayat_barang")
}

model Lampiran {
  id          String  @id @default(cuid())
  path        String
  tipe        String  // foto/dokumen
  barangId    String?
  pengajuanId String?
  createdAt   DateTime @default(now())
  @@map("lampiran")
}

model StockOpname {                       // proses bisnis terjadwal (per tahun anggaran), bukan insidental
  id                   String   @id @default(cuid())
  nomor                Int      @default(autoincrement())
  tahunAnggaran        Int      @default(0)  // periode 1 Jan s/d 31 Des
  ruanganId            String
  ruangan              Ruangan  @relation(fields: [ruanganId], references: [id])
  adminId              String
  admin                User     @relation(fields: [adminId], references: [id])
  tanggalScan          DateTime @default(now())
  waktuSelesai         DateTime?
  status               StatusOpname @default(AKTIF)
  jumlahBarangScan     Int      @default(0)
  jumlahCocok          Int      @default(0)
  jumlahTidakCocok     Int      @default(0)
  jumlahTidakTerdaftar Int      @default(0)
  jumlahHilang         Int      @default(0)
  catatan              String?  @db.Text
  detail               StockOpnameDetail[]
  @@map("stock_opname")
}

model StockOpnameDetail {
  id             String   @id @default(cuid())
  opnameId       String
  opname         StockOpname @relation(fields: [opnameId], references: [id])
  kodeBarangScan String
  barangId       String?  // null jika tidak terdaftar
  statusMatching StatusMatching
  keterangan     String?  @db.Text   // "Seharusnya di R201, Gedung A"
  ruanganAktualId String?            // lokasi aktual barang saat di-scan (FK Ruangan)
  kondisi        Kondisi?            // kondisi singkat hasil cek (ikut kondisi barang)
  fotoPath       String?             // foto barang saat opname (opsional)
  waktuScan      DateTime @default(now())
  @@index([opnameId])
  @@map("stock_opname_detail")
}

model KonfigurasiLabel {
  id            String  @id @default(cuid())
  ukuranPanjang Float   @default(6)
  ukuranLebar   Float   @default(2.5)
  jumlahPerA4   Int     @default(10)
  layoutKolom   Int     @default(2)
  fontKode      String  @default("Arial Bold 8pt")
  fontNama      String  @default("Arial 6pt")
  logoPath      String?
  @@map("konfigurasi_label")
}

model LogCetakLabel {
  id          String   @id @default(cuid())
  ruanganId   String
  adminId     String
  tanggal     DateTime @default(now())
  jumlahLabel Int
  status      String   // Berhasil/Gagal
  @@map("log_cetak_label")
}

model AuditLog {
  id        String   @id @default(cuid())
  aktor     String
  aksi      String
  entitas   String
  entitasId String?
  detail    String?  @db.Text
  waktu     DateTime @default(now())
  @@index([entitas, entitasId])
  @@map("audit_log")
}

model EmailVerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime          // valid 24 jam
  usedAt    DateTime?
  createdAt DateTime @default(now())
  @@map("email_verification_token")
}

model PasswordResetOtp {
  id        String   @id @default(cuid())
  userId    String
  otp       String            // 6 digit
  expiresAt DateTime          // valid 10 menit
  usedAt    DateTime?
  createdAt DateTime @default(now())
  @@map("password_reset_otp")
}

model LoginAttempt {
  id          String   @id @default(cuid())
  email       String
  ipAddress   String?
  success     Boolean  @default(false)
  attemptedAt DateTime @default(now())
  @@index([email, attemptedAt])
  @@map("login_attempt")
}

model JadwalMaintenance {
  id            String   @id @default(cuid())
  jenisId       String?            // jadwal default per jenis barang (oleh INVENTARIS)
  barangId      String?            // override per unit (oleh PJ_RUANG/LABORAN) — FA-25
  intervalBulan Int                // mis. AC=3, APAR=6, Genset=1
  nextDueDate   DateTime?          // jatuh tempo berikutnya → status TERJADWAL_PERAWATAN
  createdBy     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@map("jadwal_maintenance")
}

model Notifikasi {
  id          String   @id @default(cuid())
  userId      String                       // penerima
  tipe        TipeNotifikasi
  pesan       String   @db.Text
  pengajuanId String?                       // referensi sumber (opsional)
  laporanId   String?
  barangId    String?
  dibaca      Boolean  @default(false)
  createdAt   DateTime @default(now())
  @@index([userId, dibaca])
  @@map("notifikasi")
}
```

> **Catatan implementasi:** Barang punya 2 relasi ke `Ruangan` (`lokasiTerdaftar` & `lokasiAktual`). Di Prisma, relasi ganda ke model yang sama harus diberi **nama relasi eksplisit** di kedua sisi. Sesuaikan saat menulis schema final (ini kerangka).
> 

### 4.3 Aturan database

- **Soft delete** untuk domain berbenda nyata (Barang): isi `deletedAt`/`deletedBy`; list normal selalu filter `deletedAt IS NULL`.
- **Unique** kode barang via `@unique`; nomor sesi auto-increment.
- **Migrasi forward-only**: jangan edit migrasi lama yang sudah jadi history.
- Index pada kolom yang sering difilter: `lokasiAktualId`, `statusBarang`, `status` pengajuan, `opnameId`.

---

## 5. Auth & RBAC

### 5.1 Mekanisme

- **Sign up publik** (email UNS) → verifikasi email (token 24 jam) → akun `ACTIVE` role `PENGGUNA`. **Setup Wizard** (`/setup`) membuat `INVENTARIS` pertama saat DB kosong, lalu diblokir.
- Login → verifikasi **email** + bcrypt → cek `status` akun → buat JWT (`jose`, HS256) berisi `{ sub: userId, role }`.
- JWT disimpan di **cookie httpOnly** (`inv_session`), `Secure` di production, `SameSite=Lax`. Remember me: 8 jam → 30 hari.
- `src/proxy.ts` (dulu `middleware.ts`, deprecated di Next 16) membaca cookie & verifikasi JWT (optimistic check: signature/expiry/role dari klaim, tanpa query DB), **guard rute** berbasis role. Cek `status` akun (force logout bila `INACTIVE`) ditegakkan di `requireAuth()` (`lib/auth/rbac.ts`) yang dipanggil tiap Route Handler.
- **Redirect setelah login:** `PENGGUNA` → `/dashboard`, `PJ_RUANG`/`LABORAN` → `/area`, `INVENTARIS` → `/inventaris`, `PIMPINAN` → `/supervisor`.
- **Rate limit** login: 5 gagal → kunci 5 menit (tabel `login_attempt`). **Lupa password:** OTP 6 digit, valid 10 menit.

### 5.2 Penegakan di API

- Setiap Route Handler memanggil helper RBAC dari `lib/auth/rbac.ts` (mis. `requireRole('INVENTARIS')`) sebelum aksi.
- `PJ_RUANG`/`LABORAN`: query barang/pengajuan/scan **difilter ke area yang di-assign** (lewat `user_ruangan`).
- `PENGGUNA`/`PIMPINAN`: bisa baca & mengajukan, tetapi tidak mengelola data; `PIMPINAN` read-only.
- `INVENTARIS`: akses agregat global + **fallback tercatat** untuk area tanpa PJ aktif.
- **FA-11 (manajemen akun & role):** hanya `INVENTARIS`; tegakkan **1 akun = 1 role**, reassignment area manual, dan **proteksi lockout** (cegah Inventaris aktif terakhir hilang). Semua aksi menulis `AuditLog`.
- **Pemindahan (FA-05/PMD-07):** **semua role** boleh mengajukan. Dalam 1 area = 1 approval; **antar-area = dual-approval paralel** — `pengajuan.service.ts` melacak `approvalAsalBy` & `approvalTujuanBy` (urutan bebas), dan saat **keduanya** terisi men-set `status=DISETUJUI` lalu **langsung** memperbarui `lokasiAktual` barang (tanpa serah terima fisik) dalam satu transaksi + tulis `RiwayatBarang` & notifikasi. Penolakan salah satu sisi → `DITOLAK`.
- **Penghapusan (FA-27 ajukan / FA-07 validasi):** hanya `PJ_RUANG`/`LABORAN` boleh membuat `Pengajuan` jenis `PENGHAPUSAN` (barang rusak berat **atau** usang/obsolete, tidak harus dari laporan kerusakan); **persetujuan hanya oleh `INVENTARIS`**. Saat disetujui → `barang.statusBarang=DIAJUKAN_HAPUS` + tulis `RiwayatBarang` + notifikasi pengaju (FU-09); penolakan wajib isi `catatanAdmin`. **Civitas tidak boleh** mengajukan penghapusan.
- **Pantau & batalkan (FU-08 / PNG-07-08):** `GET /api/pengajuan?mine=true` dan `GET /api/laporan?mine=true` mengembalikan data milik pengaju, **digabung & diurutkan** jadi satu daftar di service/UI dengan filter jenis & status. Pembatalan lewat `PATCH /api/pengajuan/:id` / `PATCH /api/laporan/:id/status` aksi `batal` **hanya** diizinkan saat status `MENUNGGU`/`BARU`; service men-set `DIBATALKAN`, tulis `RiwayatBarang` + notifikasi. Pengaju hanya boleh beraksi atas data miliknya.
- **Notifikasi (FU-09 / NTF-01..07):** `GET /api/notifikasi` mengembalikan notifikasi milik user login (urut terbaru + badge belum dibaca); `PATCH /api/notifikasi/:id/baca` & `PATCH /api/notifikasi/baca-semua` menandai dibaca. Notifikasi dibuat sebagai **efek samping** perubahan status (pengajuan/laporan/maintenance) di service, in-app & real-time. User hanya melihat notifikasi miliknya.
- **Lihat & telusur barang (FU-10 / VWB-01..05):** semua role login (termasuk `PENGGUNA`) dapat membaca **daftar global barang** lintas ruangan via `GET /api/barang` dengan filter ruangan/status/jenis & pencarian (read-only). Detail menampilkan lokasi/info dasar, kondisi, dan status barang; field jadwal maintenance (`nextDueDate`) di-omit dari respons untuk `PENGGUNA`/`PIMPINAN` dan hanya disertakan untuk pengelola (`PJ_RUANG`/`LABORAN`/`INVENTARIS`). Operasi tulis (POST/PUT/DELETE) tetap khusus pengelola.
- **Scan Cepat verifikasi fisik (FA-12 / SCN-01..16):** hanya `PJ_RUANG`/`LABORAN` untuk area yang di-assign (`INVENTARIS` fallback tercatat). Sesi di `scan.service.ts` melakukan auto-save tiap match dan dapat dijeda lalu dilanjutkan (sesi `AKTIF`) sampai `SELESAI`. Tindak lanjut anomali dilakukan **batch** setelah sesi: barang asing milik ruangan lain hanya dicatat dan ditandai (lokasi tidak otomatis diubah), barang hilang saat sesi selesai diberi `statusBarang=HILANG` (penghapusan menyusul terpisah, sumber `STOCK_OPNAME`). Input MVP via kamera mobile. Sesi ini adalah **Stock Opname** (proses terjadwal per tahun anggaran); scan QR hanya alat pelacakan. Perawatan **tidak** otomatis dipicu dari opname (tetap dari laporan kerusakan & jadwal preventif).
- **Pembaruan kondisi barang (`Kondisi`):** kolom `barang.kondisi` **terpisah** dari `statusBarang`; di-update oleh service dari tiga sumber — (1) **verifikasi laporan kerusakan** (`laporan.service.ts` saat PJ menetapkan RUSAK_RINGAN/RUSAK_BERAT), (2) **stock opname** (`scan.service.ts` menulis kondisi aktual ke `StockOpnameDetail`, lalu boleh memperbarui `barang.kondisi`), (3) **koreksi manual** pengelola/Inventaris (`barang.service.ts`). Tiap perubahan menulis `RiwayatBarang`/`AuditLog`. Pembaruan kondisi dari opname **tidak** memicu perawatan otomatis.
- **Jangan** hanya sembunyikan tombol di UI; backend tetap wajib cek role (lihat RULES).

---

## 6. Desain API (Route Handlers)

### 6.1 Konvensi

- Base path: `/api`.
- Method: `GET` (baca), `POST` (buat/aksi), `PUT` (update penuh), `PATCH` (parsial), `DELETE` (soft delete).
- Body & query divalidasi dengan **Zod** sebelum diteruskan ke service.
- **Envelope response sukses:**
    
    ```json
    { "data": { ... } }
    ```
    
- **Paginasi:** `GET /api/barang?page=0&size=20&...filter`
    
    ```json
    { "data": [...], "page": 0, "size": 20, "total": 134, "totalPages": 7 }
    ```
    
    `page` 0-based, `size` cap 100.
    
- **Error (RFC 7807-style):**
    
    ```json
    { "title": "Validasi gagal", "status": 422, "detail": "...", "errors": { "kodeBarang": "Sudah digunakan" } }
    ```
    
- Helper terpusat `lib/api/client.ts` menangani fetch, kredensial cookie, parsing error, refresh.

### 6.2 Daftar endpoint (MVP)

| Domain | Endpoint | Method | Akses |
| --- | --- | --- | --- |
| Auth | `/api/auth/login` | POST | publik |
| Auth | `/api/auth/logout` | POST | login |
| Auth | `/api/auth/me` | GET | login |
| Barang | `/api/barang` | GET (list+filter+search+paginasi), POST (buat, multipart/form-data) | GET: semua role login; POST: PJ_RUANG/LABORAN/INVENTARIS |
| Barang | `/api/barang/:id` | GET (detail+riwayat+qr), PUT (update), DELETE (soft delete) | GET: semua role login; PUT: PJ_RUANG/LABORAN/INVENTARIS; DELETE: INVENTARIS |
| Barang | `/api/barang/:id/foto` | GET (serve foto dari storage lokal) | login |
| Barang | `/api/barang/:id/qr` | GET (data-url QR + payload JSON) | login |
| Barang | `/api/barang/import` | POST (Plan A Excel — ditunda, dependency exceljs belum) | admin |
| Master | `/api/master/gedung`, `/api/master/gedung/:id` | GET (list), POST, PUT, DELETE | INVENTARIS |
| Master | `/api/master/ruangan`, `/api/master/ruangan/:id` | GET (list), POST, PUT, DELETE | INVENTARIS |
| Master | `/api/master/ruangan/:id/penanggung-jawab` | PUT (assign PJ_RUANG/LABORAN) | INVENTARIS |
| Master | `/api/master/ruangan/pj-laboran-options` | GET (opsi user PJ_RUANG/LABORAN aktif) | INVENTARIS |
| Master | `/api/master/jenis-barang`, `/api/master/jenis-barang/:id` | GET (list), POST, PUT, DELETE | INVENTARIS |
| Kategori | `/api/kategori-approval`, `/api/kategori-approval/:id` | GET (list), POST, PUT, DELETE | INVENTARIS |
| Pengajuan | `/api/pengajuan` | GET (list), POST (buat) | user/admin |
| Pengajuan | `/api/pengajuan/:id` | GET, PATCH (approve/reject/revisi; **batal** oleh pemilik saat MENUNGGU) | pemilik / admin |
| Scan | `/api/scan/sesi` | POST (mulai) | admin |
| Scan | `/api/scan/sesi/:id/match` | POST (1 hasil scan) | admin |
| Scan | `/api/scan/sesi/:id/selesai` | POST | admin |
| Scan | `/api/scan/sesi/:id/tindak-lanjut` | POST (batch anomali) | admin |
| Scan | `/api/scan/sesi` | GET (riwayat) | admin |
| Laporan | `/api/laporan/lokasi` | GET | admin |
| Laporan | `/api/laporan/verifikasi/:sesiId` | GET | admin |
| Laporan | `/api/laporan/penghapusan?tahun=` | GET | admin |
| Export | `/api/export/daftar?status=&...` | GET (xlsx/pdf) | admin |
| Label | `/api/label/:ruanganId` | GET (data label) | admin |
| Label | `/api/label/config` | GET, PUT (logo, layout) | admin |
| Akun & Role (FA-11) | `/api/users` (list), `/api/users/:id/role`, `/api/users/:id/ruangan`, `/api/users/:id/status` | GET, PUT (ubah role / assign ruangan / aktif-nonaktif) | INVENTARIS (proteksi lockout, ADR-015: tanpa create user) |
| Notifikasi | `/api/notifikasi`, `/api/notifikasi/:id/baca`, `/api/notifikasi/baca-semua` | GET (list+badge), PATCH (tandai dibaca / semua dibaca) | login (hanya milik sendiri) |

**Endpoint Auth & Setup tambahan (v1.1):**

- `POST /api/auth/register` — sign up dengan email UNS (publik).
- `POST /api/auth/verify` — verifikasi email/token aktivasi (publik).
- `POST /api/auth/forgot` & `POST /api/auth/reset` — alur OTP lupa password (publik).
- `POST /api/setup` — bootstrap akun Inventaris pertama; hanya aktif saat DB kosong.

**Endpoint Maintenance Preventif tambahan (v1.2):**

- `GET/POST /api/maintenance/jadwal` — jadwal default per jenis barang (INVENTARIS).
- `PATCH /api/maintenance/jadwal/:barangId` — override jadwal per unit (PJ Ruang/Laboran) — FA-25.
- `GET /api/maintenance/jatuh-tempo` — daftar barang jatuh tempo + reminder (FA-26).

**Endpoint Pelaporan & Notifikasi tambahan (v1.2):**

- `POST /api/laporan` — buat laporan kerusakan (semua role); body menerima `barangId` hasil **scan/upload QR** atau pemilihan manual, plus `deskripsi` dan `foto`.
- `GET /api/laporan` — daftar laporan dengan scope per role/area (PJ Ruang/Laboran hanya area-nya; Inventaris & Pimpinan global).
- `PATCH /api/laporan/:id/status` — ubah status `DIPROSES`/`SELESAI`/`DITOLAK` oleh PJ Ruang/Laboran (atau Inventaris fallback); status `DITOLAK` **wajib** menyertakan `alasan`. Satu barang boleh punya lebih dari satu laporan aktif. Saat PJ menetapkan tindak lanjut **pemeliharaan/perbaikan**, dicatat sebagai jenis **`KOREKTIF`** di riwayat (lihat Desain DB `riwayat_maintenance`); bila **rusak berat**, diarahkan ke usulan penghapusan. **Tidak ada endpoint “ajukan pemeliharaan” untuk user** (FU-06 = lapor kerusakan).
- `GET /api/notifikasi` dan `PATCH /api/notifikasi/:id/baca` — notifikasi **in-app** pelapor, dikirim real-time tiap perubahan status laporan (model `Notifikasi`).

### 6.3 Contoh endpoint kritis: matching scan

`POST /api/scan/sesi/:id/match` body `{ kodeBarangScan }`:
1. `requireAdmin()`.
2. Load baseline ruangan dari sesi (barang yang `lokasiTerdaftar`-nya ruangan ini).
3. Cari barang by `kodeBarang`:
- tidak ada → `TIDAK_TERDAFTAR`.
- ada & terdaftar di ruangan ini → `COCOK`, set `flagVerifikasi=TERVERIFIKASI`.
- ada tapi milik ruangan lain → `TIDAK_COCOK`, keterangan = lokasi seharusnya.
4. Simpan `StockOpnameDetail`, update counter sesi.
5. Response `{ data: { statusMatching, keterangan } }` (target < 1 dtk).

---

## 7. Penyimpanan File (foto & logo)

- Abstraksi di `lib/storage/index.ts`: `saveFile(buffer, folder)`, `getFile(path)`, `deleteFile(path)`.
- **Implementasi awal:** disk lokal di `./storage/foto` & `./storage/logo` (di luar `public/`).
- File **diserve lewat Route Handler** (`/api/file/:path`) dengan cek akses, bukan dari `public/` langsung.
- Foto dikompres saat upload (maks 2 MB; lihat SRS BRG-09).
- **Migrasi ke cloud nanti:** ganti implementasi `lib/storage` (S3/Cloudinary) tanpa ubah pemanggil.

---

## 8. QR Code & Label

### 8.1 Generate QR

- Saat barang dibuat/import → `lib/qr/generate.ts` (paket `qrcode`) menghasilkan data-url/PNG. QR kini **entitas terpisah** (`QrCode`) bertipe `BARANG` atau `RUANGAN`; payload **JSON final** disimpan `TinyText` (maks 3KB, bukan varchar); satu QR `aktif` per entitas, sisanya riwayat agar bisa diganti/cetak ulang tanpa mengubah data sumber.
- **Payload QR Barang (final):**
    
    ```json
    { "v": 1, "t": "barang", "id_barang": "<uuid>", "kode_barang": "MEJA-2025-R201-0128", "id_ruangan": "<uuid>", "kode_ruangan": "R201", "nama_barang": "Meja Kerja" }
    ```
    
- **Payload QR Ruangan (final)** — set lokasi aktual saat stock opname:
    
    ```json
    { "v": 1, "t": "ruangan", "id_ruangan": "<uuid>", "kode_ruangan": "R201", "nama_ruangan": "Lab Jaringan" }
    ```
    
- `v` = versi skema payload (kompatibilitas ke depan); `t` = pembeda tipe QR saat scan (`barang` → detail/verifikasi barang; `ruangan` → set lokasi aktual sesi opname).

### 8.2 Scan

- Komponen mobile pakai `html5-qrcode` → baca string QR → kirim ke `/api/scan/.../match`.
- **Input MVP**: scan lewat **kamera ponsel/tablet** (mobile, `html5-qrcode`). Fallback input manual kode dan USB scanner (keyboard wedge) direncanakan Tahap 2.
- **Dua konteks scan:** (1) **verifikasi fisik per ruangan (FA-12)** → `/api/scan/.../match` (khusus PJ Ruang/Laboran); (2) **scan info barang (FU-03)** → resolve `qrPayload`/`kodeBarang` ke **detail barang** (`GET /api/barang/:id`) lalu tampilkan tombol cepat **Lapor Kerusakan** (`POST /api/laporan`) serta **Ajukan Pemindahan** (`POST /api/pengajuan`). Tidak ada endpoint baru.
- **Routing berdasar field `t`:** parser membaca `t` pada payload — `barang` → alur verifikasi/detail barang di atas; `ruangan` → tetapkan **lokasi aktual** (`ruangan_aktual_id`) pada baris detail stock opname yang sedang berjalan.

### 8.3 Cetak label (MVP)

- Halaman khusus `/(admin)/label/[ruanganId]/cetak` merender grid label (CSS grid, ukuran 6×2.5 cm, 2 kolom × 5–6 baris).
- CSS `@media print`: sembunyikan UI, tampilkan **crop marks** + nomor urut kecil.
- User klik Ctrl+P → “Save as PDF”. (Tahap 2: generate PDF server-side dengan `pdf-lib`/puppeteer untuk download langsung.)
- Logo dari `KonfigurasiLabel.logoPath`.

---

## 9. Seed & Data Awal

`prisma/seed.ts`:
- **Tidak** men-seed akun Inventaris langsung; akun Inventaris pertama dibuat lewat **Setup Wizard** (`/setup`) saat DB kosong.
- Master contoh: 1 gedung, beberapa ruangan (tipe `KELAS` & `LABORATORIUM`), beberapa jenis barang, kategori approval default (wajib & tidak wajib), `KonfigurasiLabel` 1 baris.

---

## 10. Environment Variables (`.env.example`)

```
DATABASE_URL="mysql://user:password@localhost:3306/inventaris"
JWT_SECRET="ganti-dengan-string-acak-panjang"
JWT_EXPIRES_IN="8h"            # remember-me diperpanjang jadi 30 hari
APP_URL="http://localhost:3000"
# Email (verifikasi akun + OTP lupa password): Mailtrap (dev) / Gmail SMTP (prod)
MAIL_HOST="sandbox.smtp.mailtrap.io"
MAIL_PORT="2525"
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM="no-reply@inventaris.uns.ac.id"
STORAGE_DIR="./storage"
NODE_ENV="development"
```

> **Jangan** commit `.env`. Hanya `.env.example` yang masuk repo.
> 

---

## 11. Pemetaan SRS → Implementasi (contoh)

| Aturan SRS | Diimplementasikan di |
| --- | --- |
| AUTH-01..16, ACC-01..07 | `lib/auth/*`, `src/proxy.ts`, `/api/auth/*` |
| KAT-02..05 (cek kategori approval) | `services/pengajuan.service.ts` |
| PMD-07 (dual-approval paralel pemindahan) | `services/pengajuan.service.ts` |
| HPS-02/09 (penghapusan: PJ ajukan, Inventaris validasi) | `services/pengajuan.service.ts` |
| PNG-07/08 (pantau status gabungan & batalkan) | `services/pengajuan.service.ts`, `services/laporan.service.ts` |
| NTF-01..07 (notifikasi in-app FU-09) | `services/notifikasi.service.ts`, `/api/notifikasi/*` |
| VWB-01..05 (lihat & telusur status barang FU-10) | `services/barang.service.ts`, `/api/barang` (GET global read-only) |
| SCN-02..16 (matching, sesi jeda/lanjut, tindak lanjut anomali batch, stock opname terjadwal) | `services/scan.service.ts`, `/api/scan/*` |
| RPT-01..04 (2 laporan) | `services/laporan.service.ts` |
| BRG-03/05 (kode unik & auto-generate) | `services/barang.service.ts`, `repositories/barang.repo.ts` |
| LBL-* (label) | `app/(admin)/label/*`, `lib/qr/*` |
| AUD-01..03 (audit) | `services/*` menulis `AuditLog` |

---

## 12. Catatan Non-Fungsional Teknis

- **Performa scan < 1 dtk:** query matching pakai index `kodeBarang` unik + fiksasi yang sudah di-cache per sesi.
- **Keamanan:** Prisma parameterized (anti SQL injection), validasi Zod, rate limit endpoint login (Tahap 2), cookie httpOnly+Secure.
- **Reliability:** backup MySQL terjadwal (dokumentasikan perintah `mysqldump`); sesi scan disimpan inkremental tiap match (bukan hanya di akhir).
- **Tahap 2 offline scan:** cache fiksasi ruangan di IndexedDB, simpan hasil lokal, sinkron batch saat online.