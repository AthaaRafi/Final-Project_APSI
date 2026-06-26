# AGENTS

# Inventaris Fakultas — Agent Guide

> Panduan untuk AI coding agent (Claude Code dsb) yang mengerjakan proyek ini.
Pakai Claude Code: salin/rename file ini menjadi `CLAUDE.md` di root agar terbaca otomatis.
Dokumen di `docs/`: `PRD.md`, `SRS.md`, `SDD.md`, `UIUX_FLOW.md`, `TASK_BREAKDOWN.md`, `RULES.md`, `DECISIONS.md`, `ENVIRONMENT.md`, `TESTING.md`, `INDEX.md`. Mulai dari `INDEX.md` untuk peta dokumen.
> 

---

## 0. Snapshot Proyek

- Aplikasi web inventaris barang fakultas. **Next.js App Router fullstack**, TypeScript strict, **MySQL 8 + Prisma**, JWT httpOnly cookie, Tailwind + shadcn/ui, TanStack Query & Table.
- Model **5 role terdesentralisasi**: `PENGGUNA`, `PJ_RUANG`, `LABORAN`, `INVENTARIS`, `PIMPINAN`. Aturan keras: **1 akun = 1 role**.
- Inti produk: pendataan barang (kode unik + QR) per ruangan; **Scan Cepat = alat Stock Opname** (verifikasi fisik terjadwal); pengajuan pemindahan, laporan kerusakan, dan usulan penghapusan; laporan internal + export manual ke universitas (**tanpa auto-submit**).

---

## 1. Aturan Wajib (Non-Negotiable)

- **Push back kalau ada yang aneh.** Kalau arsitektur, skema, requirement, atau pendekatan terasa bermasalah, sebutkan & diskusikan dulu sebelum implementasi.
- **Klarifikasi sebelum implementasi besar.** Kalau requirement ambigu atau ada beberapa tafsir masuk akal, tanya dulu daripada menulis banyak kode ke arah yang salah.
- **Stick ke scope.** Jangan refactor file/area di luar scope task. Kalau lihat masalah lain, catat di akhir response.
- **Kontributor, bukan arsitek.** Ikuti konvensi yang ada. Jangan introduce pattern, library, abstraction, atau dependency baru tanpa diskusi.
- **Jangan print, expose, atau edit secret di** `.env` kecuali user eksplisit meminta. Kalau perlu membahas env, redaksi nilai sensitif.
- **Update** `docs/TASK_BREAKDOWN.md` **setiap mulai/selesai task.** Kerjakan urut sesuai fase & dependensi.
- **Keputusan penting dicatat di** `docs/DECISIONS.md` **(ADR).** Jangan membalik keputusan yang sudah dikunci tanpa diskusi — baca dulu alasannya di sana.
- Aturan keras lain ada di `docs/RULES.md` — patuhi semuanya.

### 1.1 Aturan Khusus Proyek

- Bug di backend (service/repository/API) → **perbaiki backendnya.** Jangan bikin fallback di frontend untuk menutupi behavior backend yang salah.
- **Aturan bisnis hanya di backend (service layer).** Frontend hanya UX + konsumen API.
- **1 akun = 1 role** (`PENGGUNA`/`PJ_RUANG`/`LABORAN`/`INVENTARIS`/`PIMPINAN`). Jangan bikin role rangkap.
- Urutan & penamaan kolom **konsisten** antara list, detail, dan form untuk domain yang sama.
- Migrasi schema **forward-only** & aman untuk data existing. Jangan edit migrasi lama.
- **Jangan kirim data otomatis ke universitas/SIMAK-BMN** — sistem mandiri, hanya export manual (SRS KP-19).
- **Hasil sesi Stock Opname yang sudah** `SELESAI` **bersifat permanen** — jangan diubah (SCN-06).
- Kolom DB ruangan adalah `kode_ruangan` & `nama_ruangan` (seragam dengan payload QR). Jangan pakai `kode_ruang`/`nama_ruang`.
- Kalau perubahan membuat guidance di `AGENTS.md`/`docs` stale, **update di task yang sama.** Isi `AGENTS.md` dengan rule stabil lintas task, bukan changelog.
- Kalau ada test/command yang tidak bisa kamu jalankan (mis. butuh MySQL lokal), minta user menjalankan manual via terminal & sebutkan command-nya.

---

## 2. Source of Truth

- **Perilaku & aturan bisnis:** `docs/SRS.md`.
- **Desain teknis (arsitektur, schema, API):** `docs/SDD.md`.
- **ERD/kamus data:** `docs/Desain Database`.
- **Kontrak API aktif:** kode di `src/server/services/*` + `src/app/api/**` adalah source of truth perilaku berjalan.
- **Schema database:** `prisma/schema.prisma`.

Prioritas keputusan:
1. perilaku service backend yang aktif,
2. kontrak yang sedang dipakai frontend,
3. dokumen di `docs/`.

Kalau ada perubahan behavior/kontrak: ubah **service/backend dulu**, sesuaikan tipe & komponen frontend, lalu update dokumen terkait.

---

## 3. Baca Dulu Sebelum Implementasi

Sebelum membuat domain/flow baru, baca domain sejenis yang sudah ada:
- **CRUD master data:** lihat domain `ruangan` / `jenis-barang` / `kategori-approval`.
- **Workflow + approval:** lihat domain `pengajuan` (state machine status; pemindahan 1-area vs antar-area).
- **Fitur scan/opname:** lihat `scan.service.ts` & `app/(area)/scan`.
- **Frontend list + form:** lihat halaman `barang` (DataTable, API client, query keys, form).

Konsistensi dengan kode aktif lebih penting daripada “cara yang lebih bersih” secara abstrak.

---

## 4. Struktur Proyek

```
inventaris-fakultas/
|- prisma/                  <- schema.prisma, migrations/, seed.ts
|- src/
|  |- app/
|  |  |- (auth)/            <- publik: login, register, verify, forgot, setup (bootstrap INVENTARIS)
|  |  |- (pelapor)/         <- role PENGGUNA: /dashboard, /barang, /pengajuan
|  |  |- (area)/            <- role PJ_RUANG & LABORAN: /area, /barang, /approval, /scan, /maintenance, /label
|  |  |- (inventaris)/      <- role INVENTARIS: /inventaris, /master, /kategori-approval, /users, /laporan, /maintenance
|  |  |- (supervisor)/      <- role PIMPINAN: /supervisor (read-only global)
|  |  |- api/               <- Route Handlers (controller tipis)
|  |  |- layout.tsx         <- root providers
|  |  `- globals.css
|  |- components/  ui/  data-table/  domain/  layout/
|  |- lib/  db.ts  auth/(jwt,session,password,rbac)  api/(client,query-keys)  validation/  storage/  qr/  utils.ts
|  |- server/  services/  repositories/
|  |- types/
|  `- proxy.ts              <- guard auth + role (dulu middleware.ts, deprecated di Next 16)
|- storage/                 <- file upload lokal (di luar public/, diserve via API)
|- docs/                    <- PRD/SRS/SDD/UIUX/TASK/RULES/DECISIONS/ENVIRONMENT/TESTING/INDEX
`- .env.example
```

Route group `(auth)`, `(pelapor)`, `(area)`, `(inventaris)`, `(supervisor)` **tidak ikut URL.** Contoh `app/(area)/scan/page.tsx` -> `/scan`.

Setiap domain backend mengikuti pola: `repositories/<d>.repo.ts` (query Prisma) -> `services/<d>.service.ts` (aturan bisnis SRS) -> `app/api/<d>/route.ts` (auth + validasi Zod + delegasi) + `lib/validation/<d>.ts` (skema Zod).

---

## 5. Backend (Route Handlers + Service + Prisma)

### 5.1 Layering

- **Route Handler** (`app/api/**`) tipis: cek auth (`requireRole`/`requireAuth`), validasi Zod, panggil service, format response. **Tanpa aturan bisnis.**
- **Service** (`server/services`) berisi seluruh aturan bisnis (SRS), orkestrasi, transaksi Prisma, penulisan audit & riwayat.
- **Repository** (`server/repositories`) satu-satunya tempat query Prisma.

### 5.2 Konvensi kode

- TypeScript `strict`. Hindari `any`.
- Validasi input pakai **Zod** (skema di `lib/validation`, dipakai server & form).
- Tanggal disimpan ISO; format hanya saat display. Nama tabel `snake_case` via `@@map`, field kode `camelCase`.
- Audit fields (`createdBy`/`updatedBy`) diisi dari user sesi (`lib/auth`), bukan input request.
- Soft delete domain barang: `deletedAt`/`deletedBy`; list normal filter `deletedAt IS NULL`.

### 5.3 Pola API

- Response sukses: `{ "data": ... }`. Paginasi: `{ data, page, size, total, totalPages }`, `page` 0-based, `size` cap 100.
- Error RFC 7807-style: `{ title, status, detail, errors? }`.
- Method: `GET` baca, `POST` buat/aksi, `PUT/PATCH` update, `DELETE` soft delete.
- Backend wajib enforce invariant; jangan pindahkan validasi bisnis ke frontend.

### 5.4 Auth & RBAC (5 role)

- JWT (`jose`, HS256) berisi `{ sub, role }` di cookie httpOnly `inv_session`. Password bcrypt. `Secure` di production.
- Sign up publik (email UNS) -> verifikasi email -> akun `ACTIVE` role `PENGGUNA`. **Setup Wizard** (`/setup`) membuat `INVENTARIS` pertama saat DB kosong, lalu diblokir.
- `src/proxy.ts` (dulu `middleware.ts`, deprecated di Next 16) guard rute & role berbasis klaim JWT (optimistic check). Cek `status` akun (force logout bila `INACTIVE`) ditegakkan di `requireAuth()`.
- **Redirect login:** `PENGGUNA` -> `/dashboard`, `PJ_RUANG`/`LABORAN` -> `/area`, `INVENTARIS` -> `/inventaris`, `PIMPINAN` -> `/supervisor`.
- Helper RBAC di `lib/auth/rbac.ts`, mis. `requireRole('INVENTARIS')` / `requireRole('PJ_RUANG','LABORAN')`.
- **Scope area:** `PJ_RUANG`/`LABORAN` di-scope ke ruangan yang di-assign (lewat `user_ruangan`) untuk semua query barang/pengajuan/scan. `INVENTARIS` agregat global + **fallback tercatat** untuk area tanpa PJ aktif. `PENGGUNA`/`PIMPINAN` boleh baca global read-only.
- **Lockout protection (FA-11):** tolak demote/nonaktif/hapus terhadap INVENTARIS aktif terakhir.
- Jangan amankan hanya di UI; backend wajib menolak akses tak berizin.

### 5.5 Prisma & Migrasi

- Schema di `prisma/schema.prisma`. Migrasi forward-only (`prisma migrate dev` saat development). Jangan edit migrasi lama.
- `Barang` punya **2 relasi ke** `Ruangan` (`lokasiTerdaftar` & `lokasiAktual`) -> beri nama relasi eksplisit di kedua sisi.
- Kode unik via `@unique`. Index kolom yang sering difilter (`lokasiAktualId`, `statusBarang`, status pengajuan, `opnameId`).
- Seed lewat `prisma/seed.ts` (master contoh; akun INVENTARIS via Setup Wizard, bukan seed).

---

## 6. Frontend (Next.js App Router)

### 6.1 Stack & layout

- App Router, shadcn/ui + Radix + Tailwind. Ikon `lucide-react`, toast `sonner`.
- Tabel `@tanstack/react-table` (via shadcn data-table). Data fetching `@tanstack/react-query`.
- Root providers di `app/layout.tsx`; shell tiap role terpisah di route group `(pelapor)`/`(area)`/`(inventaris)`/`(supervisor)`.

### 6.2 Auth, scope, permission

- Token di **cookie httpOnly** — jangan simpan token di localStorage/sessionStorage.
- Setelah login, panggil `/api/auth/me` untuk isi user, role, area.
- Sembunyikan menu/aksi sesuai role di UI, tapi **backend tetap enforce.**

### 6.3 API client & React Query

- Semua HTTP request lewat `lib/api/client.ts` (kredensial cookie, parsing error, paginasi). Jangan hardcode URL.
- Query key terpusat di `lib/api/query-keys.ts`. Mutasi -> invalidate query key spesifik. **Jangan reload halaman** untuk refresh data.
- Pakai `enabled` saat prasyarat (role/id/scope) belum siap; tampilkan guard/empty state eksplisit.

### 6.4 UI & forms

- Gaya operasional/data-first (bukan marketing). Bahasa Indonesia.
- Form pakai komponen shared + pesan error per-field. Aksi destruktif pakai `ConfirmDialog` + toast.
- Warna status konsisten (lihat `docs/UIUX_FLOW.md`).

### 6.5 Scan UI

- Pakai `html5-qrcode` untuk kamera. Tombol “Mulai Scan” besar (mirip QRIS).
- Feedback tiap scan: hijau (cocok) / kuning (tidak cocok) / merah (tidak terdaftar).
- QR punya field `t`: `barang` -> buka detail/verifikasi barang; `ruangan` -> set lokasi aktual sesi opname. Sediakan fallback input manual kode bila kamera tak tersedia.

---

## 7. Aturan Domain Penting (ringkas dari SRS)

- **Kategori approval (pemindahan):** `wajib_approval=false` -> langsung tercatat (`LANGSUNG_TERCATAT`); `true` -> butuh approval. **1 area = 1 approval**; **antar-area = dual-approval paralel** (PJ asal & PJ tujuan, urutan bebas; barang pindah saat keduanya setuju). Area tanpa PJ -> Inventaris fallback tercatat.
- **Stock Opname / Scan Cepat:** baseline = barang yang `lokasiTerdaftar`-nya ruangan itu (diambil otomatis saat sesi mulai; tidak ada tabel fiksasi). Matching: cocok / tidak cocok (beri lokasi seharusnya) / tidak terdaftar. Sesi auto-save tiap scan, bisa dijeda-lanjut; **sesi** `SELESAI` **= snapshot permanen.**
- **Tindak lanjut anomali (batch):** barang asing milik ruangan lain hanya dicatat & ditandai (lokasi tak otomatis berubah); barang **hilang** (terdaftar tapi tak discan) diberi `statusBarang=HILANG` lebih dulu (penghapusan menyusul terpisah, `sumber=STOCK_OPNAME`).
- **Dua laporan:** Laporan Lokasi (real-time, bisa diperbaiki) vs Laporan Hasil Verifikasi Scan (per sesi, arsip). Perbaikan lokasi tidak menghapus anomali di laporan scan.
- **Kondisi vs Status:** `kondisi` (BAIK/RUSAK_RINGAN/RUSAK_BERAT) **terpisah** dari `statusBarang`. Kondisi di-update dari verifikasi laporan, stock opname, atau koreksi manual.
- **Flag verifikasi:** `BELUM`/`TERVERIFIKASI`/`ANOMALI`, **di-reset ke** `BELUM` **tiap awal tahun anggaran** (siklus Stock Opname).
- **Laporan kerusakan & perawatan:** semua role boleh lapor (FU-06). PJ/Laboran validasi & tetapkan tindak lanjut (perawatan korektif atau usulan hapus). Perawatan punya 2 jalur: **korektif** (dari laporan) & **preventif** (terjadwal, FA-25/26). **Stock Opname tidak memicu perawatan.**
- **Penghapusan:** hanya **PJ_RUANG/LABORAN** yang mengajukan (FA-27; rusak berat atau usang), **hanya INVENTARIS** yang memvalidasi (FA-07). Disetujui -> `statusBarang=DIAJUKAN_HAPUS` + histori tahunan. `pengajuan.sumber` = `LAPORAN_KERUSAKAN`/`STOCK_OPNAME`/`MANUAL`. Tidak ada eksekusi fisik & tidak ada auto-submit.
- **Kode barang:** `[JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT]` (mis. `MEJA-2025-R201-0128`), unik, auto-generate bila Plan B. Catatan: `[KODE_RUANG]` di sini adalah placeholder format kode barang (nilai dari `kode_ruangan`), bukan nama kolom.

---

## 8. Workflow Checklists

### 8.1 Backend domain/endpoint baru

- Baca domain sejenis yang sudah ada.
- Tambah/ubah migrasi forward-only bila schema berubah.
- Tambah skema Zod (`lib/validation`).
- Tambah repository (Prisma) -> service (aturan bisnis SRS) -> Route Handler (auth + validasi + delegasi).
- Tambah cek role (`requireRole`) + scope area bila relevan.
- Tulis audit/riwayat untuk operasi tulis.
- Update `docs/` bila kontrak/perilaku berubah; update `TASK_BREAKDOWN.md` (+ `DECISIONS.md` bila keputusan baru).

### 8.2 Frontend page/flow baru

- Baca page sejenis. Tambah API client + tipe + query key.
- Pakai React Query (`enabled` untuk prasyarat) + invalidate setelah mutasi.
- Pakai komponen shared (DataTable/Form/StatusBadge). Kolom list/detail/form & warna status konsisten.

### 8.3 Menu/navigasi baru

- Tambah halaman di route group yang benar (pelapor/area/inventaris/supervisor).
- Tambah item menu di sidebar + cek guard `src/proxy.ts` (dulu `middleware.ts`). Pastikan role yang diizinkan cocok antara UI & backend.

---

## 9. Definition of Done

Sebuah task dianggap selesai bila:
- Aturan bisnis ditegakkan di backend (service), bukan hanya frontend.
- Input divalidasi (Zod) di server.
- `npm run typecheck` & `npm run lint` bersih.
- Operasi tulis mencatat audit/riwayat bila relevan.
- Alur kritis diverifikasi (atau diminta user verifikasi bila agent tak bisa).
- `docs/TASK_BREAKDOWN.md` diperbarui; keputusan baru dicatat di `DECISIONS.md`.

---

## 10. Testing & Commands

- TypeScript: `npm run typecheck`. Lint: `npm run lint`.
- DB (development): `npx prisma migrate dev`, `npx prisma db seed`, `npx prisma studio`. Dev server: `npm run dev`.
- Kalau agent tidak bisa menjalankan (butuh DB/kamera), minta user jalankan manual & sebutkan command + konteksnya.
- Fokus verifikasi regresi: sign up + verifikasi email, login + redirect 5 role, pemindahan 1-area vs antar-area (dual approval), Stock Opname (matching + sesi SELESAI permanen + barang HILANG), penghapusan (PJ ajukan -> Inventaris validasi), notifikasi in-app, export (tanpa auto-submit), soft delete. Detail di `docs/TESTING.md`.