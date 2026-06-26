# DECISIONS

# DECISIONS — Catatan Keputusan (ADR)

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Log keputusan arsitektur & produk yang sudah **dikunci**, beserta **alasannya**. AI/manusia **jangan membalik** keputusan di sini tanpa diskusi. Format tiap entri: Konteks → Keputusan → Alasan → Konsekuensi.
> 

---

## ADR-001 — Model 5 role terdesentralisasi

- **Konteks:** Model awal hanya 2 role (USER/ADMIN) terpusat; tidak cocok dengan operasional fakultas yang per-area.
- **Keputusan:** 5 role — `PENGGUNA` (Civitas), `PJ_RUANG` (ruang kelas), `LABORAN` (laboratorium), `INVENTARIS` (rekap/pengawas global), `PIMPINAN` (read-only). **1 akun = 1 role.**
- **Alasan:** Tanggung jawab operasional didistribusikan ke pengelola area; Inventaris fokus rekap/laporan; Pimpinan memantau.
- **Konsekuensi:** Route group & redirect per role; scope area via `user_ruangan`; FA-11 untuk kelola akun + proteksi lockout.

---

## ADR-002 — Autentikasi email UNS + Setup Wizard

- **Keputusan:** Login pakai **email kampus UNS** (`@staff/@student/@uns.ac.id`), sign up publik + verifikasi email; akun INVENTARIS pertama dibuat lewat **Setup Wizard** saat DB kosong. JWT httpOnly + bcrypt.
- **Alasan:** Identitas terikat kampus; bootstrap aman tanpa seeding kredensial admin.
- **Konsekuensi:** Endpoint register/verify/forgot/reset/setup; status akun `PENDING_VERIFICATION`/`ACTIVE`/`INACTIVE`; rate limit login.

---

## ADR-003 — Kondisi terpisah dari Status Barang

- **Keputusan:** `kondisi` (BAIK/RUSAK_RINGAN/RUSAK_BERAT) adalah kolom **terpisah** dari `statusBarang` (alur).
- **Alasan:** Satu barang bisa “Rusak Ringan” (kondisi) sekaligus “Dalam Perawatan” (status); mencampurnya membuat ambigu.
- **Konsekuensi:** Kondisi di-update dari 3 sumber: verifikasi laporan, stock opname, koreksi manual. UI menampilkan dua badge.

---

## ADR-004 — QR sebagai entitas + payload JSON

- **Keputusan:** QR jadi entitas tersendiri (`qr_code`) bertipe `BARANG`/`RUANGAN`, `id` sendiri, payload **JSON** (`TinyText`, maks 3KB), satu QR `aktif` per entitas + riwayat. Field `t` membedakan tipe saat scan.
- **Alasan:** QR bisa dicetak ulang/diganti tanpa mengubah data sumber; payload kaya untuk offline & routing scan.
- **Konsekuensi:** Payload final QR Barang & QR Ruangan terkunci (lihat SDD §8.1). Scanner membaca `t` untuk routing.

---

## ADR-005 — Fiksasi dilebur ke Stock Opname

- **Konteks:** Sebelumnya ada tabel/langkah “fiksasi ruangan” terpisah sebagai baseline.
- **Keputusan:** Hapus fiksasi terpisah; **baseline = barang yang** `lokasiTerdaftar`-nya ruangan itu, diambil otomatis saat sesi Stock Opname dimulai.
- **Alasan:** Lebih efisien; menghindari duplikasi state & sinkronisasi baseline yang rawan basi.
- **Konsekuensi:** Tidak ada model `FiksasiRuangan`/endpoint fiksasi. Aturan baseline jadi BAS-01..03 di SRS.

---

## ADR-006 — Barang hilang → status HILANG dulu

- **Keputusan:** Saat sesi opname `SELESAI`, barang terdaftar yang tak terscan diberi `statusBarang=HILANG` lebih dulu; penghapusan menyusul **terpisah** (`pengajuan.sumber=STOCK_OPNAME`).
- **Alasan:** Hilang belum tentu dihapus; perlu jejak status sebelum keputusan penghapusan.
- **Konsekuensi:** Sesi `SELESAI` permanen (snapshot); tindak lanjut anomali dilakukan batch.

---

## ADR-007 — Reset flag verifikasi tiap tahun anggaran

- **Keputusan:** `flag_verifikasi` di-reset ke `BELUM` tiap awal tahun anggaran (siklus Stock Opname per 1 Jan–31 Des).
- **Alasan:** Verifikasi adalah klaim per periode; tanpa reset, status “Terverifikasi” tahun lalu menyesatkan.
- **Konsekuensi:** Ada job/aksi reset awal tahun; laporan verifikasi dihitung per tahun anggaran.

---

## ADR-008 — Rename kolom kode_ruangan / nama_ruangan

- **Keputusan:** Kolom ruangan = `kode_ruangan` & `nama_ruangan` (bukan `kode_ruang`/`nama_ruang`), seragam dengan field payload QR.
- **Alasan:** Pemetaan payload QR ↔ kolom DB jadi 1:1; mengurangi salah tulis saat coding.
- **Konsekuensi:** Schema Prisma pakai `@map("kode_ruangan")`. Placeholder `[KODE_RUANG]` di format kode barang tetap (itu token format, bukan kolom).

---

## ADR-009 — Pemindahan: 1 area = 1 approval, antar-area = dual paralel

- **Keputusan:** Kategori wajib approval: dalam 1 area cukup 1 approval PJ; antar-area butuh approval **PJ asal & PJ tujuan** (urutan bebas). Barang pindah saat keduanya setuju.
- **Alasan:** Melindungi kedua area (pelepas & penerima) tanpa memaksa urutan kaku.
- **Konsekuensi:** `pengajuan` punya `isAntarArea`, `approvalAsalBy`, `approvalTujuanBy`. Area tanpa PJ -> fallback Inventaris tercatat.

---

## ADR-010 — Penghapusan: PJ ajukan, Inventaris validasi

- **Keputusan:** Hanya `PJ_RUANG`/`LABORAN` boleh mengajukan penghapusan (FA-27; rusak berat atau usang), **hanya** `INVENTARIS` yang memvalidasi (FA-07). Civitas tidak boleh. Tidak ada eksekusi fisik / auto-submit.
- **Alasan:** Pemisahan pengaju vs pemutus; kontrol terpusat di Inventaris untuk pelaporan tahunan.
- **Konsekuensi:** `pengajuan.sumber` = `LAPORAN_KERUSAKAN`/`STOCK_OPNAME`/`MANUAL`; histori tahunan; export manual.

---

## ADR-011 — Maintenance 2 jalur; opname tidak memicu perawatan

- **Keputusan:** Perawatan = **korektif** (dari laporan kerusakan) + **preventif** (terjadwal: default per jenis oleh Inventaris, override per unit oleh PJ/Laboran). **Stock Opname tidak memicu perawatan otomatis.**
- **Alasan:** Opname adalah verifikasi lokasi/keberadaan, bukan diagnosis kondisi/servis.
- **Konsekuensi:** Status `TERJADWAL_PERAWATAN` dari jadwal; reminder FA-26; riwayat `PREVENTIF`/`KOREKTIF`.

---

## ADR-012 — Sistem mandiri, tanpa integrasi otomatis

- **Keputusan:** Tidak ada koneksi otomatis ke SIMAK-BMN/universitas; hanya **export manual**. Alur berhenti di Inventaris.
- **Alasan:** Batas scope & kebijakan; menghindari ketergantungan sistem eksternal.
- **Konsekuensi:** Fitur export (Excel/PDF); pembuatan surat di luar sistem.

---

## ADR-013 — Pin Prisma ke v6 LTS (bukan v7)

- **Konteks:** Saat setup Fase 0, `npm install prisma @prisma/client` menarik v7 (rilis terbaru). Prisma 7 mengubah generator default jadi `prisma-client` (output custom, ESM-only), menghapus `datasource.url` dari schema.prisma, dan mewajibkan driver adapter (`@prisma/adapter-mariadb` + `mariadb`) di `PrismaClient`. Ini menyimpang signifikan dari kerangka SDD §4.2 (`generator client { provider = "prisma-client-js" }`, `new PrismaClient()` standar).
- **Keputusan:** Pin `prisma` & `@prisma/client` ke `6.19.3` (LTS). Generator tetap `prisma-client-js`, `datasource.url = env("DATABASE_URL")`, `new PrismaClient()` tanpa adapter, seed via `package.json#prisma.seed`.
- **Alasan:** Match 100% dengan SDD §4.2 & ENVIRONMENT.md tanpa menambah dependency baru (driver adapter) atau pola baru (`prisma.config.ts`, custom generator output) yang tidak didiskusikan.
- **Konsekuensi:** Saat `npm install`/`npm update`, jangan biarkan `prisma`/`@prisma/client` naik ke v7 tanpa diskusi ulang. Bila suatu saat migrasi ke v7 disepakati, perlu update `lib/db.ts` (driver adapter), `schema.prisma` (generator + hapus `url`), dan semua import path Prisma Client.

---

## ADR-014 — `proxy.ts` (bukan `middleware.ts`) + status check di `requireAuth()`

- **Konteks:** Saat T1-04, Next.js 16.2.9 men-deprecate konvensi `middleware.ts` ("⚠ The middleware file convention is deprecated. Please use proxy instead") menjadi `proxy.ts` (fungsi sama: file `src/proxy.ts` setingkat `src/app/`, export `proxy()` bukan `middleware()`). Dokumentasi Next.js juga menyatakan Proxy **tidak dimaksudkan** untuk slow data fetching / sebagai solusi sesi & otorisasi penuh — hanya untuk "optimistic check".
- **Keputusan:** Rename `middleware.ts` -> `src/proxy.ts`, export `proxy()`. Proxy hanya melakukan **optimistic check**: verifikasi signature & expiry JWT, lalu guard rute berdasarkan `role` dari klaim token (tanpa query Prisma). Pengecekan `status` akun di DB (force logout AUTH-13 saat `INACTIVE`) dipindah seluruhnya ke `requireAuth()` (`lib/auth/rbac.ts`), yang dipanggil tiap Route Handler login (termasuk `/api/auth/me`).
- **Alasan:** Mengikuti konvensi resmi Next.js 16 terbaru (menghindari deprecated API di proyek baru); menghindari query DB di tiap request halaman (proxy berjalan untuk semua path), sambil tetap menegakkan AUTH-13 secara otoritatif di layer yang memang query DB (Route Handler).
- **Konsekuensi:** Token JWT yang valid tapi untuk akun yang sudah `INACTIVE` masih lolos proxy (redirect berbasis role tetap jalan), tapi setiap panggilan API yang lewat `requireAuth()`/`requireRole()` (termasuk `/api/auth/me` yang dipanggil di awal load halaman) akan menolak & menghapus cookie. Halaman yang **tidak** memanggil API ber-auth sama sekali tidak akan force-logout instan — pastikan tiap halaman terproteksi memanggil `/api/auth/me` atau endpoint ber-auth lain saat load (T1-07).

---

## ADR-015 — Manajemen User (T2-05): kelola akun existing saja, tanpa form "buat user baru"

- **Konteks:** SRS FA-11 menyebut "CRUD" akun oleh INVENTARIS, namun Fase 1 sudah punya alur sign-up publik (email UNS + verifikasi email) yang menjadi satu-satunya jalur pembuatan akun `PENGGUNA`. Ada dua tafsir: (a) INVENTARIS juga bisa membuat akun baru langsung, atau (b) INVENTARIS hanya mengelola akun yang sudah ada.
- **Keputusan:** T2-05 **tidak** menyediakan form "buat user baru". "CRUD" untuk FA-11 = Read (list akun) + Update (ubah role, ubah `StatusUser` ACTIVE/INACTIVE, assign/lepas ruangan untuk PJ_RUANG/LABORAN). Akun hanya dibuat lewat alur registrasi + verifikasi email (Fase 1) atau Setup Wizard (akun INVENTARIS pertama).
- **Alasan:** Menghindari dua jalur pembuatan akun yang bisa divergen (mis. akun dibuat INVENTARIS tanpa email terverifikasi); konsisten dengan ACC-01/07 dan alur registrasi yang sudah berjalan.
- **Konsekuensi:** `/api/users` hanya GET (list) + PUT untuk `/:id/role`, `/:id/status`, `/:id/ruangan`. Tidak ada `POST /api/users`. Bila ke depan dibutuhkan pembuatan akun manual oleh INVENTARIS (mis. civitas tanpa email UNS), perlu diskusi ulang & ADR baru.

---

## ADR-016 — Audit log generik (`AuditLog`) untuk operasi tulis master data & akun

- **Konteks:** SDD belum punya mekanisme audit terpusat saat Fase 2 (CRUD Gedung/Ruangan/Jenis Barang/Kategori Approval/Manajemen User) dimulai, namun beberapa DoD & ACC-06 (FA-11) mensyaratkan jejak audit untuk perubahan data master & akun.
- **Keputusan:** Tambah model `AuditLog` generik (`aktor`, `aksi`, `entitas`, `entitasId`, `detail`, `createdAt`) via `writeAuditLog()` (`src/server/repositories/audit.repo.ts`). Setiap operasi tulis (CREATE/UPDATE/DELETE pada Gedung/Ruangan/Jenis Barang/Kategori Approval, serta UPDATE_ROLE/ACTIVATE/DEACTIVATE/ASSIGN_RUANGAN pada User) memanggil helper ini dari service layer dengan `aktor` = `session.sub` dan `detail` berupa deskripsi singkat berbahasa Indonesia.
- **Alasan:** Satu model generik lebih sederhana daripada tabel riwayat per-domain untuk data master yang jarang berubah; cukup untuk kebutuhan jejak audit Fase 2 tanpa menambah banyak tabel baru.
- **Konsekuensi:** Domain dengan riwayat khusus (mis. `RiwayatBarang` untuk Barang) tetap memakai tabel riwayat sendiri — `AuditLog` hanya untuk operasi master data & akun yang tidak butuh riwayat terstruktur per-entitas. Bila suatu domain butuh riwayat lebih detail/terstruktur di kemudian hari, evaluasi ulang apakah `AuditLog` masih cukup atau perlu tabel riwayat khusus.

---

## Cara menambah ADR baru

Saat ada keputusan arsitektur/produk yang baru atau berubah: tambahkan entri `ADR-0xx` dengan format yang sama, beri tanggal, dan rujuk dari `TASK_BREAKDOWN.md`/dokumen terkait. Jangan menghapus ADR lama — tandai **Superseded by ADR-0yy** bila diganti.