# TASK_BREAKDOWN

# Task Breakdown & Progress Tracker

> **Status:** Selaras spesifikasi final (PRD/SRS/SDD/Desain DB) · **Tanggal:** 12 Juni 2026
**Tujuan:** Mencatat progres agar tidak chaos / tidak mengulang pekerjaan. **Update file ini setiap selesai satu task.Dokumen terkait:** [`PRD.md`](./PRD.md) · [`SRS.md`](./SRS.md) · [`SDD.md`](./SDD.md) · [`AGENTS.md`](../AGENTS.md)
> 

---

## Cara Pakai (penting)

1. **Kerjakan urut dari atas.** Task di bawah sering bergantung pada task di atasnya.
2. Tandai status dengan checkbox: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai.
3. Setelah menyelesaikan task, **isi catatan** di kolom Catatan (mis. nama file yang dibuat) bila perlu.
4. Sebuah task baru boleh `[x]` jika **Definition of Done (DoD)** terpenuhi.
5. Jangan kerjakan task lintas-fase di luar urutan tanpa alasan jelas (lihat RULES & AGENTS).

**Legend status:** `[ ]` Todo · `[~]` In progress · `[x]` Done · `[!]` Blocked

---

## DoD Umum (berlaku untuk semua task kode)

- Aturan bisnis ditegakkan di **backend** (service), bukan hanya frontend.
- Input divalidasi (Zod) di server.
- Tidak ada error TypeScript (`npm run typecheck`) & lint bersih (`npm run lint`).
- Endpoint yang menulis data mencatat **audit** + **riwayat** bila relevan.
- Mengikuti pola folder & konvensi di SDD/AGENTS.

---

## FASE 0 — Setup Proyek (fondasi)

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T0-01 | Init Next.js (App Router, TypeScript, ESLint, Tailwind) | — | App jalan di `localhost:3000` |
| [x] | T0-02 | Pasang shadcn/ui + lucide-react + sonner | T0-01 | Komponen UI dasar terpasang |
| [x] | T0-03 | Setup Prisma + koneksi MySQL + `.env.example` | T0-01 | Schema valid (Prisma 6 LTS, lihat ADR-013); `.env`/`.env.example` lengkap |
| [x] | T0-04 | Buat skema Prisma awal (semua model di SDD §4) | T0-03 | Migrasi `init` sukses ke MySQL lokal |
| [x] | T0-05 | Prisma client singleton (`lib/db.ts`) | T0-03 |  |
| [x] | T0-06 | Struktur folder (`server/`, `lib/`, route groups) sesuai SDD §3 | T0-01 | Route groups `(auth)/(pelapor)/(area)/(inventaris)/(supervisor)` lengkap — selesai di T1-06/T1-07 |
| [x] | T0-07 | Helper API: envelope response, error handler, paginasi (`lib/api`) | T0-06 | Format konsisten SDD §6.1 |
| [x] | T0-08 | Lapisan `lib/storage` (disk lokal) + route serve file | T0-06 | Modul siap; pengujian upload nyata menyusul Fase 2 |
| [x] | T0-09 | `seed.ts`: master contoh | T0-04 | `prisma db seed` sukses, data master tervalidasi |

### Rincian langkah & sub-langkah — Fase 0 (siap eksekusi)

Tabel di atas adalah pelacak ringkas. Toggle di bawah memerinci tiap task jadi sub-langkah konkret + file + perintah. Acuan penuh: [ENVIRONMENT](https://app.notion.com/p/ENVIRONMENT-a55c9973672d411dac452cc108dbeedf?pvs=21) (bootstrap) dan [SDD](https://app.notion.com/p/SDD-378aabe17e0c80cfa63cd884075e33d4?pvs=21). Fase 1–8 dirinci dengan pola yang sama saat tiba gilirannya.

- T0-01 · Init Next.js
    
    Tujuan: proyek dasar berjalan dan tooling kualitas siap.
    
    - [x]  Jalankan `create-next-app` (TypeScript, ESLint, Tailwind, App Router, `--src-dir`, alias `@/*`) — lihat ENVIRONMENT §2 langkah 1
    - [x]  Pastikan `strict: true` di `tsconfig.json`
    - [x]  Tambah script `typecheck` (`tsc --noEmit`) di `package.json`
    - [x]  Verifikasi `npm run dev` membuka `localhost:3000`
    
    DoD: `npm run dev`, `npm run lint`, `npm run typecheck` bersih.
    
- T0-02 · Dependency inti + shadcn/ui
    
    Tujuan: pustaka inti dan komponen UI dasar terpasang.
    
    - [x]  Pasang dependency runtime: `prisma`, `@prisma/client`, `zod`, `jose`, `bcryptjs`, `@tanstack/react-query`, `@tanstack/react-table`, `sonner`, `lucide-react`, `qrcode`, `html5-qrcode`
    - [x]  Pasang devDeps tipe: `@types/bcryptjs`, `@types/qrcode`
    - [x]  Inisialisasi shadcn/ui (`npx shadcn@latest init`, preset Nova/Radix)
    - [x]  Tambah komponen: button, input, table, dialog, badge, form, sonner, dropdown-menu, select, label (+ `react-hook-form`/`@hookform/resolvers` untuk form)
    - [x]  Pasang `<Toaster />` (sonner) di root layout
    
    DoD: komponen dasar bisa dirender tanpa error.
    
- T0-03 · Prisma + MySQL + .env
    
    Tujuan: koneksi database siap dan konfigurasi env terdokumentasi.
    
    - [x]  `npx prisma init --datasource-provider mysql` (lalu pin ke Prisma 6 LTS, lihat ADR-013 — `npm install` default menarik v7 yang butuh driver adapter & generator baru, menyimpang dari SDD §4.2)
    - [x]  Buat `.env.example` lengkap (semua variabel di ENVIRONMENT §3)
    - [x]  Salin ke `.env` (placeholder; user isi `DATABASE_URL` & `JWT_SECRET` acak panjang sendiri)
    - [x]  Set `prisma.seed` di `package.json` menunjuk `prisma/seed.ts` (via `tsx`)
    - [x]  Pastikan `.env` masuk `.gitignore`, hanya `.env.example` yang di-commit
    
    DoD: schema Prisma valid (`npx prisma validate`). Koneksi MySQL nyata (`prisma db pull`/migrate) menyusul di T0-04 setelah user isi `DATABASE_URL`.
    
- T0-04 · Skema Prisma (enum + model)
    
    Tujuan: seluruh skema data sesuai SDD §4 termigrasi.
    
    - [x]  Definisikan semua enum sesuai SDD §4.1 (Role, StatusUser, TipeRuangan, Kondisi, StatusBarang, FlagVerifikasi, JenisPengajuan, StatusPengajuan, StatusOpname, StatusMatching, TipeQr, SumberPenghapusan, TipeNotifikasi)
    - [x]  Definisikan semua model sesuai SDD §4.2 (User, UserRuangan, Gedung, Ruangan, JenisBarang, KategoriApproval, Barang, QrCode, Pengajuan, RiwayatBarang, Lampiran, StockOpname, StockOpnameDetail, KonfigurasiLabel, LogCetakLabel, AuditLog, EmailVerificationToken, PasswordResetOtp, LoginAttempt, JadwalMaintenance, Notifikasi) — Pengajuan & JadwalMaintenance unified sesuai SDD (bukan varian split di DATABASE.md)
    - [x]  Beri nama relasi eksplisit untuk dua relasi Barang ke Ruangan (`BarangLokasiTerdaftar` / `BarangLokasiAktual`)
    - [x]  Petakan kolom snake_case dengan `@map` (`kode_ruangan`, `nama_ruangan`)
    - [x]  `npx prisma validate` & `npx prisma generate` sukses (Prisma 6 LTS)
    - [x]  Jalankan `npx prisma migrate dev --name init` — sukses, `prisma/migrations/20260613052048_init/` terbuat & diterapkan ke `mysql://root:@localhost:3306/inventaris`
    
    Catatan: `StockOpname.nomor` ditambah `@unique` (selain `@default(autoincrement())`) karena MySQL connector Prisma mewajibkan field autoincrement non-id punya unique/index — tidak mengubah semantik "nomor sesi auto-increment" di SDD §4.3.
    
    DoD: skema valid, client tergenerate, migrasi pertama sukses & tabel terbentuk di MySQL — selesai.
    
- T0-05 · Prisma client singleton
    
    Tujuan: satu instance Prisma yang aman untuk dev (hindari koneksi ganda saat hot-reload).
    
    - [x]  Buat `lib/db.ts` dengan pola singleton global
    
    DoD: `import { db } from "@/lib/db"` dipakai konsisten di seluruh server.
    
- T0-06 · Skeleton folder (SDD §3)
    
    Tujuan: struktur folder konsisten sebelum fitur ditulis.
    
    - [x]  Buat `lib/(auth,api,validation,storage,qr)`
    - [x]  Buat `server/(services,repositories)`
    - [x]  Buat `components/(data-table,domain,layout)` (selain `ui/` yang sudah ada dari T0-02) dan `types/`
    - [x]  Buat folder `storage/foto`, `storage/logo` (+ `.gitignore` agar isi upload tidak ter-commit, struktur folder tetap via `.gitkeep`)
    - [x]  Route groups `app/(auth|pelapor|area|inventaris|supervisor)` — dibuat di Fase 1 (T1-06/T1-07) bersamaan dengan halaman & shell layout per role
    
    DoD: struktur folder non-route sama persis dengan SDD §3; route groups selesai di Fase 1 (T1-06/T1-07).
    
- T0-07 · Helper API (envelope, error, paginasi)
    
    Tujuan: format response dan penanganan error seragam.
    
    - [x]  Envelope sukses `{ data }` (`lib/api/response.ts`: `ok`, `created`, `paginated`)
    - [x]  Error handler terpusat gaya RFC 7807 (`lib/api/errors.ts`: `ApiError` + `toProblemResponse`, menangani `ZodError` otomatis)
    - [x]  Util paginasi `page`/`size` (0-based, cap 100) di `lib/api/pagination.ts`
    - [x]  `lib/api/client.ts` (fetch wrapper, credentials cookie, parsing error RFC 7807) + `lib/api/query-keys.ts` (factory kosong, mulai dari `auth.me`)
    - [x]  `QueryClientProvider` dipasang via `app/providers.tsx` di root layout (provider sebelumnya belum ada meski `@tanstack/react-query` sudah terpasang T0-02)
    
    DoD: format konsisten dengan SDD §6.1; `npm run typecheck` & `npm run lint` bersih.
    
- T0-08 · Storage disk lokal + route serve file
    
    Tujuan: unggah dan ambil file (foto barang, bukti, logo) berjalan.
    
    - [x]  `lib/storage/index.ts`: `saveFile(buffer, folder, ext)`, `getFile(path)`, `deleteFile(path)` di `STORAGE_DIR` (`./storage/foto`, `./storage/logo`), dengan guard path-traversal
    - [x]  Route `GET /api/file/[...path]` untuk menyajikan file tersimpan (Content-Type dari ekstensi, 404 RFC 7807 bila tidak ada)
    - [x]  `lib/storage/validation.ts`: tipe gambar diizinkan (JPG/PNG/WebP) + ukuran maks 2MB sesuai SRS BRG-09
    
    Catatan: route `/api/file` belum di-gate role/auth karena `requireAuth`/`requireRole` belum ada (T1-05). Endpoint upload nyata (foto barang dsb.) & kompresi gambar menyusul di Fase 2 saat domain `barang` dibuat — `lib/storage` di sini hanya menyediakan abstraksi simpan/ambil/hapus.
    
    DoD: modul tersedia & tipe konsisten (`typecheck`/`lint` bersih); pengujian end-to-end (upload→serve) menyusul saat endpoint upload domain dibuat di Fase 2.
    
- T0-09 · Seed master
    
    Tujuan: data awal untuk pengembangan dan uji.
    
    - [x]  `prisma/seed.ts`: 1 Gedung (Gedung A), 3 Ruangan (R201/R202 KELAS, LAB-NET LABORATORIUM), 5 JenisBarang (MEJA/KURSI/AC/KOMPUTER/APAR), 2 KategoriApproval (Elektronik wajib, Mebel tidak), `JadwalMaintenance` default untuk AC (3 bln) & APAR (6 bln), beberapa Barang contoh per ruangan + QR Barang & QR Ruangan, 1 `KonfigurasiLabel` default — semua via `upsert` (idempotent)
    - [x]  Jalankan `npx prisma db seed` — sukses (1 gedung, 3 ruangan, 5 jenis barang, 2 kategori approval, 5 barang, 8 QR code, 2 jadwal maintenance, 1 konfigurasi label)
    
    Catatan: sesuai TESTING.md §2-3, seed **tidak** membuat akun user apa pun (termasuk akun demo per role) — INVENTARIS pertama dibuat lewat `/setup` (Fase 1), akun demo lain dibuat manual setelahnya via FA-11 agar password tidak hardcode/commit. Item "akun demo per role" di checklist sebelumnya diperbaiki agar konsisten dengan TESTING.md (dianggap stale).
    
    DoD: skrip seed tervalidasi tipe (`typecheck`/`lint` bersih), `npx prisma db seed` sukses & data master terverifikasi di database — selesai.
    

> **Catatan Fase 1 (selesai):** `JWT_SECRET` di `.env` sudah diisi dengan string acak (generated, bukan placeholder) sebelum T1-01 dikerjakan.
> 

> **Smoke test penutup Fase 0:** `npm run dev` lalu buka `/setup` saat DB tanpa INVENTARIS, buat akun INVENTARIS pertama, login, pastikan redirect ke `/inventaris`. Setelah lulus, Fase 0 dianggap selesai (lihat ENVIRONMENT §5). Catatan: `/setup` & redirect role adalah hasil Fase 1 (T1-06/T1-07), bukan Fase 0 — smoke test ini menjadi gerbang transisi ke Fase 1.
> 

---

## FASE 1 — Auth & RBAC (gerbang semua fitur)

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T1-01 | Hash password (bcrypt) + util JWT (`jose`) | T0-05 | SRS AUTH-01/02 — selesai |
| [x] | T1-02 | `POST /api/auth/login` + set cookie httpOnly | T1-01 | Pesan error generik (AUTH-08) — selesai |
| [x] | T1-03 | `POST /api/auth/logout` + `GET /api/auth/me` | T1-02 | selesai |
| [x] | T1-04 | `proxy.ts` (dulu `middleware.ts`, deprecated di Next 16) guard rute + role | T1-02 | Guard rute per route group sesuai 5 role — selesai |
| [x] | T1-05 | Helper `requireAuth()/requireRole()` | T1-02 | Dipakai semua endpoint — selesai |
| [x] | T1-06 | Halaman `/login`  • redirect berbasis role | T1-04 | PENGGUNA→/dashboard, PJ_RUANG & LABORAN→/area, INVENTARIS→/inventaris, PIMPINAN→/supervisor (AUTH-03) — selesai, termasuk /register /verify /forgot /reset /setup |
| [x] | T1-07 | Shell layout per 5 role (sidebar/topbar) | T1-06 | Menu sesuai UIUX §2 — selesai |

### Rincian langkah & sub-langkah — Fase 1 (siap eksekusi)

Gerbang semua fitur. Acuan: SDD §5 (Auth/RBAC) dan SRS AUTH.

- T1-01 · Hash password + util JWT
    
    Tujuan: fondasi kredensial dan token aman.
    
    - [x]  `lib/auth/password.ts`: hash & verify dengan bcryptjs
    - [x]  `lib/auth/jwt.ts`: sign & verify token jose HS256 pakai `JWT_SECRET`, exp `JWT_EXPIRES_IN`
    - [x]  `lib/auth/session.ts`: tulis/baca cookie `inv_session` (httpOnly, sameSite lax, secure di prod)
    
    DoD: round-trip sign lalu verify berhasil (SRS AUTH-01/02) — diverifikasi via skrip Node, `typecheck` bersih. Selesai.
    
- T1-02 · Login endpoint + cookie
    
    Tujuan: autentikasi dasar berjalan.
    
    - [x]  Zod schema login di `lib/validation/auth.ts` (email, password, rememberMe)
    - [x]  `server/repositories/auth.repo.ts` + `server/services/auth.service.ts`: verifikasi user + cek StatusUser ACTIVE + validasi domain email UNS (AUTH-02)
    - [x]  Set cookie `inv_session` saat sukses (`lib/auth/session.ts`, remember-me 8h/30d)
    - [x]  Catat LoginAttempt; rate limit 5 gagal → kunci 5 menit (AUTH-14); pesan error generik (AUTH-15)
    
    DoD: kredensial benar set cookie; salah (password/domain/lockout) balas 401 generik — diverifikasi end-to-end via curl terhadap MySQL lokal. Selesai.
    
- T1-03 · Logout + me
    
    Tujuan: kelola sesi aktif.
    
    - [x]  `POST /api/auth/logout` hapus cookie
    - [x]  `GET /api/auth/me` kembalikan profil + role dari sesi
    
    DoD: me akurat saat login, 401 saat tidak (termasuk setelah logout & saat akun di-set INACTIVE) — diverifikasi via curl. Selesai.
    
- T1-04 · Proxy guard rute (dulu Middleware)
    
    Tujuan: lindungi rute berbasis role.
    
    Catatan: Next.js 16 men-deprecate konvensi `middleware.ts` → `proxy.ts` (fungsi sama, lokasi sama: `src/proxy.ts` karena project pakai `src/`). Proxy hanya melakukan **optimistic check** (verifikasi JWT signature/expiry/role dari klaim, tanpa query DB) sesuai rekomendasi Next.js; pengecekan `status` akun (force logout AUTH-13) ditegakkan di `requireAuth()` (T1-05) yang dipanggil tiap Route Handler — bukan di proxy.
    
    - [x]  `src/proxy.ts` verifikasi JWT & lindungi tiap route group berdasar role dari token
    - [x]  Belum login / token invalid → redirect ke `/login`
    - [x]  Akses lintas-role ditolak → redirect ke home role masing-masing (mis. PENGGUNA ke `/inventaris` → balik ke `/dashboard`)
    
    DoD: tiap prefix rute terlindungi sesuai 5 role — diverifikasi via curl dengan token JWT per role. Selesai.
    
- T1-05 · Helper requireAuth/requireRole
    
    Tujuan: penegakan RBAC konsisten.
    
    - [x]  `lib/auth/rbac.ts`: `requireAuth()` (verifikasi JWT + cek status ACTIVE di DB, force logout AUTH-13 bila tidak) dan `requireRole(...roles)`
    - [x]  Lempar 401/403 standar (`ApiError`); dipakai `/api/auth/me`
    
    DoD: helper dipakai konsisten di server; AUTH-13 (force logout akun INACTIVE) terverifikasi via curl. Selesai.
    
- T1-06 · Halaman publik & redirect role
    
    Tujuan: alur masuk lengkap untuk 5 role.
    
    - [x]  UI `/login` (form react-hook-form + zod, checkbox "ingat saya", toast error sonner)
    - [x]  Redirect per role: PENGGUNA → /dashboard, PJ_RUANG & LABORAN → /area, INVENTARIS → /inventaris, PIMPINAN → /supervisor (AUTH-03)
    - [x]  `/setup`: cek `/api/setup` (GET), buat INVENTARIS pertama saat belum ada (POST), lalu redirect `/login` bila sudah terkunci
    - [x]  `/register` (email UNS) + verifikasi email (EmailVerificationToken 24 jam) via `/verify?token=`
    - [x]  Lupa password via OTP 6 digit (PasswordResetOtp 10 menit): `/forgot` → `/reset` (email + OTP + password baru)
    - [x]  Backend: route handler `POST /api/auth/register|verify|forgot|reset`, `GET/POST /api/setup`, `lib/mail` (nodemailer + Mailtrap sandbox SMTP — `MAIL_USER`/`MAIL_PASS` diisi user sendiri di `.env`)
    - [x]  `src/components/ui/checkbox.tsx` (shadcn/radix-ui) untuk "ingat saya"
    
    DoD: alur masuk lengkap; redirect tepat per role. Diverifikasi: `/api/setup` → buat akun INVENTARIS pertama → login → cookie `inv_session` ter-set → `/` redirect ke `/inventaris` → akses `/dashboard` (role lain) redirect balik ke `/inventaris` → `/api/setup` jadi `available:false`. `npm run typecheck` & `npm run lint` bersih. Pengiriman email aktual (verifikasi/OTP) belum diuji nyata — menunggu `MAIL_USER`/`MAIL_PASS` Mailtrap diisi user. Selesai (Mailtrap SMTP test menyusul saat kredensial tersedia).
    
- T1-07 · Shell layout per 5 role
    
    Tujuan: kerangka navigasi tiap role.
    
    - [x]  Layout untuk `(pelapor)`/`(area)`/`(inventaris)`/`(supervisor)` (sidebar desktop + dropdown menu mobile + topbar) via `AppShell` (`components/layout/app-shell.tsx`, `sidebar.tsx`, `user-menu.tsx`)
    - [x]  Menu per role sesuai UIUX §4/§5 (sitemap) — `lib/nav-config.ts` (`NAV_ITEMS`, `ROLE_LABEL`)
    - [x]  Info user (nama + role) + tombol logout (dropdown akun) di shell
    - [x]  Tiap layout route group panggil `requireRole(...)` (T1-05) + ambil nama user untuk shell
    - [x]  Halaman index per role (placeholder dashboard): `/dashboard`, `/area`, `/inventaris`, `/supervisor`
    
    DoD: shell + menu + redirect tervalidasi untuk 5 role via curl (login per role → akses home masing-masing → menu sesuai UIUX → akses lintas-role ditolak/redirect → logout → akses ditolak). `npm run typecheck` & `npm run lint` bersih. T0-06 (route groups) kini selesai sepenuhnya. Selesai.
    
    DoD: tiap role melihat menu sesuai perannya.
    

**Uji terima fase:** KP-01, KP-02 (sebagian), AUTH-*.

---

## FASE 2 — Master Data (prasyarat barang)

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T2-01 | CRUD Gedung | T1-05 | admin-only write |
| [x] | T2-02 | CRUD Ruangan (kode, gedung, lantai, PJ) | T2-01 | kode unik |
| [x] | T2-03 | CRUD Jenis Barang | T1-05 | kode unik |
| [x] | T2-04 | CRUD Kategori Approval (wajib/tidak) | T1-05 | SRS KAT-01 (KP-14) |
| [x] | T2-05 | Manajemen User (CRUD + role + ruangan PJ) | T1-05 | FA-11 |

### Rincian langkah & sub-langkah — Fase 2 (siap eksekusi)

Master data prasyarat barang. Tulis hanya untuk INVENTARIS. Acuan: SDD §4/§6, SRS KAT/FA-11.

- T2-01 · CRUD Gedung
    
    Tujuan: master gedung tersedia.
    
    - [x]  repo + service + route `gedung` (list/create/update/delete)
    - [x]  Zod validasi; tulis hanya INVENTARIS (`requireRole`)
    - [x]  UI tabel + dialog form
    
    DoD: CRUD jalan, audit tercatat (`AuditLog` aksi CREATE/UPDATE/DELETE). Hapus diblokir bila masih dirujuk `Ruangan`. `npm run typecheck` & `npm run lint` bersih. Selesai.
    
- T2-02 · CRUD Ruangan
    
    Tujuan: master ruangan + penanggung jawab.
    
    - [x]  Field `kode_ruangan` (unik), `nama_ruangan`, gedung, tipe (KELAS/LABORATORIUM), lantai
    - [x]  Assign PJ_RUANG/LABORAN ke ruangan (UserRuangan M2M)
    
    DoD: ruangan terkelola, kode unik dijaga backend (`findRuanganByKode`). Hapus diblokir bila masih dirujuk `Barang` (lokasi terdaftar/aktual). Assign PJ via dialog checkbox (opsi dari user role PJ_RUANG/LABORAN aktif), audit tercatat. `npm run typecheck` & `npm run lint` bersih. Selesai.
    
- T2-03 · CRUD Jenis Barang
    
    Tujuan: master jenis barang.
    
    - [x]  CRUD `jenisBarang` dengan kode unik
    
    DoD: jenis barang terkelola, kode unik dijaga backend, hapus diblokir bila masih dirujuk `Barang`, audit tercatat. `npm run typecheck` & `npm run lint` bersih. Selesai.
    
- T2-04 · CRUD Kategori Approval
    
    Tujuan: tentukan kategori yang butuh approval.
    
    - [x]  CRUD `kategoriApproval` dengan flag `wajibApproval`
    
    DoD: kategori menentukan butuh approval atau tidak (SRS KAT-01, KP-14). Hapus diblokir bila masih dirujuk `Barang`, audit tercatat. Tidak ada constraint unik pada `nama` (sesuai schema, tidak ada `@unique`). `npm run typecheck` & `npm run lint` bersih. Selesai.
    
- T2-05 · Manajemen User (FA-11)
    
    Tujuan: INVENTARIS mengelola semua akun.
    
    - [x]  Kelola akun existing: ubah role + StatusUser (ACTIVE/INACTIVE) — tanpa form buat user baru (akun dibuat lewat alur registrasi Fase 1, ADR-015)
    - [x]  Assign ruangan untuk PJ_RUANG/LABORAN
    - [x]  Aktif/nonaktif akun
    
    DoD: seluruh akun & role terkelola — list (`/api/users`), ubah role (`/api/users/:id/role`), ubah status (`/api/users/:id/status`), assign ruangan (`/api/users/:id/ruangan`). Lockout INVENTARIS terakhir aktif diblokir (ACC-05). Ganti role keluar dari PJ_RUANG/LABORAN otomatis melepas penugasan ruangan + `areaWarning` ke UI (ACC-04). Audit tercatat tiap perubahan (ACC-06). `npm run typecheck` & `npm run lint` bersih. Selesai.
    

---

## FASE 3 — Barang & Kode & QR

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T3-01 | Service generate/validasi kode barang | T2-02,T2-03 | Format & unik (BRG-01/03) |
| [x] | T3-02 | Auto-generate nomor urut per ruangan/tahun (Plan B) | T3-01 | KP-15 |
| [x] | T3-03 | CRUD Barang + upload foto + soft delete | T3-01,T0-08 | BRG-09/10 |
| [x] | T3-04 | Generate QR digital saat buat/import (`lib/qr`) | T3-03 | KP-20 |
| [x] | T3-05 | List barang + filter + paginasi (scope USER ke ruangannya) | T3-03 | KP-01 |
| [x] | T3-06 | Detail barang (lokasi terdaftar vs aktual, dll) | T3-03 | FU-04 |
| [x] | T3-07 | Pencarian barang (kode/nama/jenis) | T3-05 | FU-03 |
| [ ] | T3-08 | Import Excel (Plan A) + validasi duplikat | T3-03 | BRG-04 — ditunda (dependency exceljs belum diinstall) |

### Rincian langkah & sub-langkah — Fase 3 (siap eksekusi)

Inti data barang + kode + QR. Acuan: SDD §4/§8 (QR), SRS BRG/FU.

- T3-01 · Service kode barang
    
    Tujuan: kode barang valid dan unik.
    
    - [x]  Format kode sesuai aturan (BRG-01) + cek unik (BRG-03)
    - [x]  Validasi di server (Zod regex `[JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT 4 digit]`)
    
    DoD: kode valid & unik dijamin backend (`findBarangByKode`; Plan B auto-generate via `generateKodeBarang`). `npm run typecheck` & `npm run lint` bersih. Selesai.
    
- T3-02 · Auto nomor urut (Plan B)
    
    Tujuan: penomoran otomatis tanpa input manual.
    
    - [x]  Generate nomor urut per ruangan per tahun (count existing + 1, termasuk deleted agar tidak reuse)
    
    DoD: nomor otomatis benar (KP-15). Selesai.
    
- T3-03 · CRUD Barang + foto + soft delete
    
    Tujuan: pengelolaan barang lengkap.
    
    - [x]  Field: jenis, kondisi, statusBarang, flagVerifikasi, lokasiTerdaftar, lokasiAktual, penguasaan
    - [x]  Upload foto via `lib/storage` (wajib saat CREATE, opsional saat UPDATE) — max 2MB, JPEG/PNG/WebP
    - [x]  Soft delete (`deletedAt`/`deletedBy`, `statusBarang=NONAKTIF`)
    
    DoD: BRG-09/10 terpenuhi. Foto wajib di backend. Riwayat tercatat di `RiwayatBarang`. Selesai.
    
- T3-04 · Generate QR
    
    Tujuan: QR digital per barang.
    
    - [x]  `lib/qr/generate.ts` buat QR data-url via paket `qrcode` + simpan `QrCode` (tipe BARANG) saat CREATE
    - [x]  Payload JSON final: `{ v:1, t:"barang", id_barang, kode_barang, id_ruangan, kode_ruangan, nama_barang }`
    - [x]  `GET /api/barang/:id/qr` kembalikan data-url + payload untuk ditampilkan UI
    
    DoD: QR ter-generate saat buat (KP-20). Serve foto via `GET /api/barang/:id/foto`. Selesai.
    
- T3-05 · List + filter + paginasi
    
    Tujuan: daftar barang dengan akses sesuai role.
    
    - [x]  Tabel barang + filter (search/jenisId/kondisi/statusBarang/ruanganId) + paginasi server
    - [x]  Scope: PJ_RUANG/LABORAN hanya ruangannya (via `getUserScopeRuanganIds`); INVENTARIS global
    
    DoD: KP-01. Halaman `/barang` untuk INVENTARIS, `/barang` (pelapor) untuk PENGGUNA, `/area/barang` untuk PJ_RUANG/LABORAN via App Router route groups. Selesai.
    
- T3-06 · Detail barang
    
    Tujuan: tampilan detail lengkap.
    
    - [x]  Tampilkan lokasi terdaftar vs aktual, kondisi, status, riwayat, foto, QR data-url
    
    DoD: FU-04. Badge "Berbeda" bila lokasiAktual ≠ lokasiTerdaftar. Selesai.
    
- T3-07 · Pencarian
    
    Tujuan: temukan barang cepat.
    
    - [x]  Cari berdasarkan kode/nama/jenis (search param di GET `/api/barang`) dengan debounce via "Enter" atau tombol Cari
    
    DoD: FU-03. Selesai.
    
- T3-08 · Import Excel (Plan A)
    
    Tujuan: input massal barang.
    
    - [ ]  Parse Excel (exceljs) + validasi duplikat + ringkasan hasil
    
    DoD: BRG-04. **Ditunda** — dependency `exceljs` belum diinstall; dikerjakan setelah Fase 4 (ADR-017 bila diputuskan install).
    

---

## FASE 4 — Pengajuan & Approval

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T4-01 | Service pengajuan + cek konflik aktif | T3-03 | PNG-02 — selesai |
| [x] | T4-02 | Pemindahan: cek kategori approval (langsung vs antrian) | T4-01,T2-04 | KAT-02..05 (KP-04) — selesai |
| [x] | T4-03 | Form pemindahan + indikator approval (UI) | T4-02 | PMD-02/03 — indikator wajib/langsung di PemindahanDialog — selesai |
| [x] | T4-04 | Lapor kerusakan + foto (maintenance preventif ditunda) | T4-01 | LAP-06 statusBarang=DILAPORKAN_RUSAK — selesai |
| [x] | T4-05 | Usulan penghapusan + bukti | T4-01 | HPS-09 role check backend; form PenghapusanDialog — selesai |
| [x] | T4-06 | Approval admin (approve/reject/revisi + catatan) | T4-02 | state machine SRS §5.1; ApprovalDialog + /area/approval + /inventaris/pengajuan — selesai |
| [x] | T4-07 | Update lokasi/status barang saat approve | T4-06 | KP-05 — lokasiAktual & statusBarang diupdate di service — selesai |
| [ ] | T4-08 | Notifikasi in-app perubahan status | T4-06 | Skip untuk saat ini; hanya RiwayatBarang dicatat (keputusan sesi ini) |
| [x] | T4-09 | Halaman “Pengajuan Saya” (user) + area approval page | T4-03 | FU-08 — /pengajuan (PENGGUNA), /area/approval (PJ/Laboran), /inventaris/pengajuan (INVENTARIS) — selesai |

### Rincian langkah & sub-langkah — Fase 4 (siap eksekusi)

Pengajuan & approval (termasuk dual-approval antar-area dan maintenance preventif). Acuan: SDD §5 (PMD-07, penghapusan), SRS §5.1 state machine.

- T4-01 · Service pengajuan + cek konflik
    
    Tujuan: dasar pengajuan dengan proteksi konflik.
    
    - [x]  Buat Pengajuan (JenisPengajuan) + cek tidak ada pengajuan aktif konflik (PNG-02)
    - [x]  `server/repositories/pengajuan.repo.ts` + `server/services/pengajuan.service.ts`
    - [x]  `lib/validation/pengajuan.ts` (Zod: pemindahan/kerusakan/penghapusan/approval/list)
    
    DoD: konflik aktif dicegah backend. Selesai.
    
- T4-02 · Pemindahan: kategori approval + dual-approval
    
    Tujuan: rute approval sesuai kategori & lintas-area.
    
    - [x]  Cek `wajibApproval` kategori → langsung tercatat atau masuk antrian (KAT-02..05)
    - [x]  Antar-area: set `isAntarArea`, butuh approval asal & tujuan (approvalAsalBy/approvalTujuanBy)
    - [x]  `POST /api/pengajuan/pemindahan`
    
    DoD: KP-04 + dual-approval antar-area benar. Selesai.
    
- T4-03 · Form pemindahan + indikator approval
    
    Tujuan: UI pemindahan yang jelas.
    
    - [x]  `PemindahanDialog` menampilkan badge Wajib Approval / Langsung Tercatat (PMD-02/03)
    - [x]  Tombol "Pindah" di detail barang (area + inventaris roles)
    
    DoD: indikator approval jelas sebelum submit. Selesai.
    
- T4-04 · Lapor kerusakan + foto
    
    Tujuan: alur perawatan reaktif. Maintenance preventif ditunda ke fase berikutnya.
    
    - [x]  Lapor kerusakan + foto → `statusBarang=DILAPORKAN_RUSAK` (LAP-06); `POST /api/pengajuan/kerusakan`
    - [x]  `LaporanKerusakanDialog` tersedia di semua role dari halaman detail barang
    
    DoD: laporan kerusakan tercatat; statusBarang terupdate saat laporan dibuat. Selesai.
    
- T4-05 · Usulan penghapusan + bukti
    
    Tujuan: usulan hapus oleh PJ.
    
    - [x]  PJ_RUANG/LABORAN ajukan penghapusan + lampiran bukti → menunggu validasi INVENTARIS (HPS-09)
    - [x]  `PenghapusanDialog` di area detail barang; `POST /api/pengajuan/penghapusan`
    - [x]  Backend enforce HPS-09 role check; PNG-02 cek konflik aktif
    
    DoD: usulan menunggu validasi Inventaris. Selesai.
    
- T4-06 · Approval (approve/reject/revisi)
    
    Tujuan: keputusan pengajuan sesuai state machine.
    
    - [x]  Transisi StatusPengajuan sesuai SRS §5.1 (MENUNGGU → DISETUJUI/DITOLAK/REVISI → SELESAI)
    - [x]  Catatan approval; INVENTARIS memvalidasi penghapusan (FA-27/FA-07)
    - [x]  `ApprovalDialog`; `/area/approval` (PJ/Laboran); `/inventaris/pengajuan` (INVENTARIS)
    
    DoD: transisi status valid & tercatat. Selesai.
    
- T4-07 · Update lokasi/status saat approve
    
    Tujuan: data barang konsisten pasca keputusan.
    
    - [x]  Saat disetujui: pemindahan → `lokasiAktual` diupdate; penghapusan → `DIAJUKAN_HAPUS`; kerusakan → `DALAM_PERAWATAN` (KP-05)
    
    DoD: barang sinkron dengan hasil approval. Selesai.
    
- T4-08 · Notifikasi in-app
    
    Tujuan: pemberitahuan perubahan status.
    
    - [ ]  Catat RiwayatBarang ✓ (sudah dicatat di service); kirim Notifikasi in-app (PNG-04, FU-09) — **Skip** untuk sesi ini sesuai keputusan user
    
    DoD: Ditunda. RiwayatBarang sudah tercatat; notifikasi in-app dikerjakan di T8-02.
    
- T4-09 · Halaman Pengajuan Saya + approval pages
    
    Tujuan: semua role bisa memantau & memproses pengajuan.
    
    - [x]  `/pengajuan` (PENGGUNA): daftar + batalkan (FU-08)
    - [x]  `/area/approval` (PJ_RUANG/LABORAN): approval pemindahan & kerusakan
    - [x]  `/inventaris/pengajuan` (INVENTARIS): semua pengajuan + filter jenis/status + approval kerusakan/penghapusan
    
    DoD: status pengajuan transparan ke semua pihak. Selesai.
    

---

## FASE 5 — Stock Opname & Scan Cepat (inovasi utama)

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T5-01 | Baseline ruangan otomatis (barang terdaftar; tanpa tabel fiksasi) | T3-03 | BAS-01..03 · `scan.repo.ts#getBaselineRuangan` |
| [x] | T5-02 | Mulai sesi stock opname + load baseline ruangan | T5-01 | SCN-01 · `scan.service.ts#mulaiSesi`, `POST /api/scan` |
| [x] | T5-03 | Service matching (cocok/tidak cocok/tidak terdaftar) | T5-02 | SCN-02/03 (KP-11) · `scan.service.ts#prosesHasilScan` |
| [x] | T5-04 | Notifikasi anomali “Seharusnya di R…, Gedung…” | T5-03 | SCN-04 (KP-12) · keterangan di-set di service saat TIDAK_COCOK |
| [x] | T5-05 | UI Scan Cepat (kamera `html5-qrcode`, tombol besar, feedback warna) | T5-03 | UIUX §4.4 · `(area)/scan/[id]/page.tsx` |
| [ ] | T5-06 | Fallback input manual kode | T5-05 | **SKIP** (SRS SCN-12 Tahap 2) — ditangguhkan |
| [x] | T5-07 | Selesai sesi + ringkasan (termasuk hilang & asing) | T5-03 | SCN-05 (KP-16) · `selesaikanSesi`, tombol “Selesaikan Sesi” + tab Hasil Scan |
| [x] | T5-08 | Set flag_verifikasi (BELUM/TERVERIFIKASI/ANOMALI) saat cocok | T5-03 | SCN-07 · `updateBarang({flagVerifikasi:”TERVERIFIKASI”})` di service |
| [x] | T5-09 | Tindak lanjut anomali (perbaiki lokasi/sesuaikan db/tandai hilang) | T5-07 | SCN-08 · `tindakLanjutAnomali` service + dialog UI di halaman sesi |
| [x] | T5-10 | Tandai barang asing sebagai anomali (TIDAK_TERDAFTAR), tanpa penambahan otomatis | T5-07 | SCN-09 · TIDAK_TERDAFTAR dicatat di detail; barang hilang di-set HILANG saat selesai |

### Rincian langkah & sub-langkah — Fase 5 (siap eksekusi)

Stock Opname & Scan Cepat (inovasi utama). Baseline = barang terdaftar, tanpa tabel fiksasi. Acuan: SDD §8 (QR), SRS SCN/BAS, UIUX §4.4.

- T5-01 · Baseline ruangan otomatis
    
    Tujuan: acuan opname tanpa fiksasi terpisah.
    
    - [x]  Baseline = barang terdaftar di ruangan (tanpa tabel fiksasi) — `scan.repo.ts#getBaselineRuangan`
    
    DoD: BAS-01..03. ✅
    
- T5-02 · Mulai sesi opname
    
    Tujuan: sesi opname siap dengan baseline.
    
    - [x]  Buat StockOpname (tahunAnggaran, ruangan, admin) + load baseline ruangan (SCN-01) — `scan.service.ts#mulaiSesi`, `POST /api/scan`
    
    DoD: sesi aktif dengan baseline termuat. ✅
    
- T5-03 · Service matching
    
    Tujuan: klasifikasi hasil scan.
    
    - [x]  Tentukan StatusMatching: COCOK / TIDAK_COCOK / TIDAK_TERDAFTAR (SCN-02/03) — `scan.service.ts#prosesHasilScan`, `POST /api/scan/[id]/scan`
    
    DoD: KP-11. ✅
    
- T5-04 · Notifikasi anomali lokasi
    
    Tujuan: arahkan tindak lanjut lokasi.
    
    - [x]  Pesan “Seharusnya di R…, Gedung…” saat lokasi tak cocok (SCN-04) — field `keterangan` di-set service saat TIDAK_COCOK, ditampilkan di feedback UI
    
    DoD: KP-12. ✅
    
- T5-05 · UI Scan Cepat
    
    Tujuan: pemindaian cepat dengan umpan balik jelas.
    
    - [x]  Kamera html5-qrcode, tombol besar, feedback warna sesuai matching (UIUX §4.4) — `(area)/scan/[id]/page.tsx`
    
    DoD: scan memberi umpan balik warna instan. ✅
    
- T5-06 · Fallback input manual
    
    Tujuan: opname tetap jalan tanpa kamera.
    
    - [ ]  Input kode manual bila kamera gagal — **SKIP** (SRS SCN-12 Tahap 2, ditangguhkan)
    
    DoD: ada jalur cadangan tanpa kamera. ⏭ Ditunda
    
- T5-07 · Selesai sesi + ringkasan
    
    Tujuan: tutup sesi dengan rekap.
    
    - [x]  Tutup sesi + ringkasan (cocok, hilang, asing) (SCN-05) — `selesaikanSesi`, tombol “Selesaikan Sesi” + tab Hasil Scan, `POST /api/scan/[id]/selesai`
    
    DoD: KP-16. ✅
    
- T5-08 · Set flag_verifikasi
    
    Tujuan: tandai status verifikasi barang.
    
    - [x]  Saat cocok set FlagVerifikasi = TERVERIFIKASI (SCN-07) — `updateBarang({flagVerifikasi:”TERVERIFIKASI”})` di `prosesHasilScan`
    
    DoD: status verifikasi terisi benar. ✅
    
- T5-09 · Tindak lanjut anomali
    
    Tujuan: selesaikan ketidakcocokan.
    
    - [x]  Perbaiki lokasi / sesuaikan DB / tandai HILANG (SCN-08) — `tindakLanjutAnomali` service + dialog per-item di halaman sesi, `POST /api/scan/[id]/tindak-lanjut`
    
    DoD: anomali ditindaklanjuti; opname tidak memicu perawatan. ✅
    
- T5-10 · Barang asing
    
    Tujuan: tangani barang tak terdaftar.
    
    - [x]  Tandai TIDAK_TERDAFTAR sebagai anomali, tanpa penambahan otomatis (SCN-09) — dicatat di `OpnameDetail`; barang hilang (baseline - scanned) di-set `statusBarang=HILANG` saat sesi selesai
    
    DoD: tidak ada auto-add barang asing. ✅
    

---

## FASE 6 — Filter, Histori Tahunan, Laporan

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T6-01 | Filter barang penanganan khusus | T3-05 | FA-13 (KP-13) · tombol preset "Penanganan Khusus" di halaman barang; query param `penangananKhusus=true` di API |
| [x] | T6-02 | Histori tahunan penghapusan (grouping per tahun) | T4-05 | HPS-03/04 (KP-17) · `(inventaris)/penghapusan/page.tsx` + `GET /api/penghapusan` |
| [x] | T6-03 | 📍 Laporan Lokasi Barang (real-time) | T4-07 | RPT-01/02 · `(inventaris)/laporan/lokasi` + `GET /api/laporan/lokasi` |
| [x] | T6-04 | 📋 Laporan Hasil Stock Opname (per sesi) | T5-07 | RPT-03 · `(inventaris)/laporan/opname` — reuse `/api/scan` |
| [x] | T6-05 | Laporan inventaris + filter periode/lokasi/jenis/kondisi/status | T3-05 | FA-09 (KP-08) · `(inventaris)/laporan/inventaris` + `GET /api/laporan/inventaris` |
| [x] | T6-06 | Audit trail untuk aktivitas penting | T4-06 | AUD-01 (KP-09) · `(inventaris)/laporan/audit` + `GET /api/laporan/audit` |

### Rincian langkah & sub-langkah — Fase 6 (siap eksekusi)

Filter, histori tahunan, dan laporan. Acuan: SRS FA/RPT/HPS/AUD.

- T6-01 · Filter penanganan khusus
    
    Tujuan: sorot barang yang butuh perhatian khusus.
    
    - [x]  Filter barang penanganan khusus (FA-13, KP-13) — param `penangananKhusus=true` di API; tombol preset di halaman barang inventaris; filter HILANG + DIAJUKAN_HAPUS + RUSAK_BERAT
    
    DoD: filter berfungsi. ✅
    
- T6-02 · Histori tahunan penghapusan
    
    Tujuan: telusur penghapusan per tahun.
    
    - [x]  Grouping penghapusan per tahun (HPS-03/04, KP-17) — `GET /api/penghapusan`, halaman `(inventaris)/penghapusan`, filter tombol per tahun
    
    DoD: histori per tahun tampil. ✅
    
- T6-03 · Laporan Lokasi Barang
    
    Tujuan: posisi barang terkini.
    
    - [x]  Laporan lokasi real-time (RPT-01/02) — `GET /api/laporan/lokasi`, halaman `(inventaris)/laporan/lokasi`, tampilan lokasiTerdaftar→lokasiAktual
    
    DoD: lokasi terkini akurat. ✅
    
- T6-04 · Laporan Hasil Stock Opname
    
    Tujuan: tinjau hasil per sesi.
    
    - [x]  Laporan per sesi opname (RPT-03) — halaman `(inventaris)/laporan/opname`, reuse `/api/scan`, link ke detail sesi
    
    DoD: hasil sesi bisa ditinjau. ✅
    
- T6-05 · Laporan inventaris + filter
    
    Tujuan: laporan inventaris fleksibel.
    
    - [x]  Filter periode/lokasi/jenis/kondisi/status (FA-09, KP-08) — `GET /api/laporan/inventaris`, halaman dengan filter kondisi + status + jenis + ruangan + flag verifikasi + tahun min/max
    
    DoD: laporan tersaring sesuai kriteria. ✅
    
- T6-06 · Audit trail
    
    Tujuan: jejak aktivitas penting.
    
    - [x]  Catat AuditLog aktivitas penting (AUD-01, KP-09) — `writeAuditLog` sudah dipanggil di semua service; viewer `GET /api/laporan/audit` + halaman `(inventaris)/laporan/audit`
    
    DoD: jejak audit lengkap. ✅
    

---

## FASE 7 — QR Label & Export

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T7-01 | Upload logo instansi + Konfigurasi Label | T0-08 | `label.repo.ts`, `api/label/config/route.ts`, `(inventaris)/label/page.tsx` |
| [x] | T7-02 | Halaman cetak label batch per ruangan (grid 6×2.5cm) | T3-04,T7-01 | `(area)/label/page.tsx`, CSS @media print, React Query untuk QR generation |
| [x] | T7-03 | Crop marks + auto-singkat nama panjang | T7-02 | Crop marks di `PrintLabel` component; auto-truncate nama >38 char |
| [x] | T7-04 | Log cetak label | T7-02 | `api/label/cetak/route.ts` → `createLogCetak` di repo |
| [x] | T7-05 | Export daftar barang (Excel/PDF) untuk universitas | T6-05 | `api/export/barang/route.ts` dengan exceljs; `(inventaris)/export/page.tsx`; filter lengkap |
| [x] | T7-06 | Pastikan TIDAK ada auto-submit ke universitas | T7-05 | Export hanya via tombol manual; tidak ada trigger otomatis (KP-19 by design) |

### Rincian langkah & sub-langkah — Fase 7 (siap eksekusi)

QR label fisik & export manual (tanpa auto-submit). Acuan: SRS LBL/EXP/HPS.

- T7-01 · Logo + Konfigurasi Label
    
    Tujuan: siapkan template label instansi.
    
    - [x]  Upload logo instansi + simpan KonfigurasiLabel (LBL-05, KP-24) — `label.repo.ts#upsertKonfigurasiLabel`, `api/label/config/route.ts` GET+PUT
    - [x]  Halaman konfigurasi untuk INVENTARIS — `(inventaris)/label/page.tsx` dengan form useForm + file upload
    
    DoD: konfigurasi label tersimpan.
    
- T7-02 · Cetak label batch
    
    Tujuan: cetak massal per ruangan.
    
    - [x]  Backend: `api/label/barang/route.ts` ambil barang per ruangan dengan QR payload
    - [x]  Frontend: `(area)/label/page.tsx` — pilih ruangan, generate QR (via `qrcode` lib + React Query), preview grid, tombol cetak
    - [x]  CSS @media print dengan `#label-print-area` tersembunyi, tampil saat print
    
    DoD: KP-21/22/23.
    
- T7-03 · Crop marks + auto-singkat nama
    
    Tujuan: hasil cetak rapi.
    
    - [x]  Crop marks 4 sudut di setiap label (`PrintLabel` component)
    - [x]  Auto-truncate nama >38 char dan kode >22 char dengan ellipsis (LBL-04/06)
    
    DoD: label rapi tercetak.
    
- T7-04 · Log cetak label
    
    Tujuan: rekam aktivitas cetak.
    
    - [x]  `createLogCetak` di `label.repo.ts`
    - [x]  `api/label/cetak/route.ts` POST — dipanggil setelah `window.print()` (LBL-07)
    
    DoD: aktivitas cetak terekam.
    
- T7-05 · Export Excel/PDF
    
    Tujuan: ekspor data untuk universitas.
    
    - [x]  `api/export/barang/route.ts` — GET dengan filter, exceljs workbook, streaming response XLSX
    - [x]  `(inventaris)/export/page.tsx` — filter ruangan/jenis/kondisi/status/tahun, tombol unduh
    - [x]  Nav INVENTARIS: item "Export Data" + "Konfigurasi Label" ditambahkan ke `nav-config.ts`
    
    DoD: file ekspor valid.
    
- T7-06 · Tanpa auto-submit
    
    Tujuan: jaga sistem tetap mandiri.
    
    - [x]  Tidak ada trigger otomatis — export hanya dari tombol UI manual (KP-19 by design)
    - [x]  Catatan eksplisit di halaman export: "tidak ada pengiriman otomatis"
    
    DoD: hanya ekspor manual.
    

---

## FASE 8 — Penyempurnaan & Uji Terima

| ✓ | ID | Task | Bergantung | Catatan / DoD |
| --- | --- | --- | --- | --- |
| [x] | T8-01 | Dashboard user & admin (kartu statistik) | T6-05 | `dashboard.repo.ts`, `api/dashboard/route.ts`, dashboard page untuk 4 role (PENGGUNA/AREA/INVENTARIS/PIMPINAN) |
| [x] | T8-02 | Notifikasi in-app (dashboard) | T4-08 | `api/notifikasi/route.ts`, `notifikasi-list.tsx`, halaman notifikasi 3 role, badge unread di sidebar, trigger di pengajuan service |
| [x] | T8-03 | Empty/loading/error state semua halaman | semua | `error.tsx` + `loading.tsx` di 4 route group; semua halaman sudah punya `isLoading` check + `EmptyState` |
| [x] | T8-04 | SOP input awal launch dalam app (tooltip/checklist) | T7-02 | `(inventaris)/panduan/page.tsx` — 7 langkah setup dengan link ke halaman terkait (KP-25) |
| [ ] | T8-05 | Jalankan checklist Kriteria Penerimaan KP-01..KP-25 | semua | **Butuh validasi manual user** — login browser, scan kamera, dst |
| [x] | T8-06 | Dokumentasikan cara backup MySQL | T0-03 | `docs/ENVIRONMENT.md` §6: mysqldump, storage backup, restore, cron, jadwal retensi ✅ |

### Rincian langkah & sub-langkah — Fase 8 (siap eksekusi)

Penyempurnaan & uji terima. Acuan: SRS KP-01..KP-25, UIUX §8.

- T8-01 · Dashboard user & admin
    
    Tujuan: ringkasan per role.
    
    - [x]  `dashboard.repo.ts` — `getStatsGlobal`, `getStatsArea`, `getStatsPengguna`
    - [x]  `api/dashboard/route.ts` — GET, dispatch per role
    - [x]  `StatCard` komponen di `components/domain/dashboard/stat-card.tsx`
    - [x]  Dashboard PENGGUNA — kartu total/menunggu/selesai pengajuan + shortcut
    - [x]  Dashboard AREA (PJ/Laboran) — kartu total barang, kondisi, khusus, approval menunggu, banner CTA
    - [x]  Dashboard INVENTARIS — kartu global + breakdown kondisi + banner sesi aktif
    - [x]  Dashboard PIMPINAN (Supervisor) — same as global, read-only
    - [x]  Query key `dashboard.stats` di `query-keys.ts`
    
    DoD: dashboard informatif.
    
- T8-02 · Notifikasi in-app
    
    Tujuan: pemberitahuan terpusat.
    
    - [x]  `api/notifikasi/route.ts` — GET (list + ?count=true unread), PATCH (tandai semua baca)
    - [x]  `api/notifikasi/[id]/route.ts` — PATCH (tandai satu baca)
    - [x]  `dashboard.repo.ts` — `listNotifikasiUser`, `countUnreadNotifikasi`, `markNotifikasiRead`, `markAllNotifikasiRead`, `createNotifikasi`
    - [x]  `NotifikasiList` komponen di `components/domain/notifikasi/`
    - [x]  Halaman notifikasi di `(pelapor)`, `(area)`, `(inventaris)` — semua pakai komponen yang sama
    - [x]  Sidebar: badge unread count (polling 60 detik) di item notifikasi
    - [x]  Trigger notifikasi di `pengajuan.service.ts` — saat pemindahan dibuat (ke PJ), laporan kerusakan dibuat (ke PJ), dan setiap perubahan status approval (ke pengaju)
    
    DoD: notifikasi tampil & bisa dibaca.
    
- T8-03 · State UI
    
    Tujuan: pengalaman konsisten.
    
    - [x]  `error.tsx` di `(pelapor)`, `(area)`, `(inventaris)`, `(supervisor)` — error boundary dengan tombol "Coba Lagi"
    - [x]  `loading.tsx` di 4 route group — spinner saat navigasi server component
    - [x]  Semua halaman useQuery sudah punya `isLoading` check + `EmptyState` / teks loading inline
    
    DoD: tidak ada state kosong tak tertangani.
    
- T8-04 · SOP input awal
    
    Tujuan: bantu input data awal saat launch.
    
    - [x]  Halaman `/panduan` di `(inventaris)` — 7 langkah urut dengan ikon, deskripsi, link ke halaman terkait, referensi KP
    - [x]  Nav INVENTARIS: item "Panduan Setup" dengan ikon BookOpen
    - [x]  Proxy: `/panduan` di-guard INVENTARIS only
    
    DoD: panduan awal tersedia in-app.
    
- T8-05 · Checklist KP
    
    Tujuan: validasi kriteria penerimaan.
    
    - [ ]  Jalankan KP-01..KP-25 **— wajib dilakukan user secara manual** (butuh browser, MySQL, kamera fisik)
    
    DoD: semua KP lulus.
    
- T8-06 · Backup MySQL
    
    Tujuan: ketahanan data.
    
    - [x]  Dokumentasikan prosedur backup MySQL — `docs/ENVIRONMENT.md` §6: mysqldump, storage backup, restore, cron, jadwal retensi
    
    DoD: prosedur backup terdokumentasi (NFR reliability). ✅
    

---

## FASE 9 — Design System Retrofit

| ✓ | ID | Task | Catatan |
| --- | --- | --- | --- |
| [x] | T9-01 | Fondasi: 3 font, CSS variables, dark mode | Plus Jakarta Sans + Inter + JetBrains Mono via next/font; globals.css indigo brand + slate neutral; dark mode toggle di user menu; shadow/radius/animation tokens |
| [x] | T9-02 | Komponen shared: Card, DataTable, Sidebar, Topbar, Toast, EmptyState, Skeleton, StatCard, error/loading states | Design system §7 |
| [x] | T9-03 | Layar signature: Login split + gradient, Dashboard count-up, Detail Barang timeline, Skeleton loading | Design system §8 |
| [x] | T9-04 | Motion: transisi halaman, hover kartu, stagger tabel, skeleton shimmer, prefers-reduced-motion | Design system §6 |

## FASE 10 — SaaS Dashboard Retrofit (§14)

| ✓ | ID | Task | Catatan |
| --- | --- | --- | --- |
| [x] | T10-01 | Fondasi: verifikasi font/CSS/dark mode masih bersih | Sudah dari Fase 9 |
| [x] | T10-02 | Shell & komponen: Sidebar filled indigo, Topbar avatar, StatCard, DataTable borderless, Users page | §14.1–14.8 |
| [ ] | T10-03 | Layar signature: Login, Dashboard, Detail Barang, Scan Cepat | §14 + §8 |
| [ ] | T10-04 | Motion halus: transisi halaman, hover, skeleton | §6 + §14 |

---

## TAHAP 2 (setelah MVP) — Backlog

| ✓ | ID | Task |
| --- | --- | --- |
| [ ] | B2-01 | Export PDF/Excel kaya (styling, template) |
| [ ] | B2-02 | Notifikasi email |
| [ ] | B2-03 | Preview label sebelum cetak + atur layout 2/3 kolom |
| [ ] | B2-04 | Riwayat & banding sesi scan (FA-23/24) |
| [ ] | B2-05 | **Offline mode Scan Cepat** (cache + sinkron) |
| [ ] | B2-06 | Filter laporan lanjutan |
| [ ] | B2-07 | Rate limit login + hardening keamanan |
| [ ] | B2-08 | Migrasi storage ke cloud (S3/Cloudinary) |

---

## Catatan Progres (log singkat)

> Tambahkan baris saat ada milestone penting. Contoh format:
> 

```
2026-06-05  Setup repo & Prisma schema awal selesai (T0-01..T0-04).
2026-06-16  Fase 3 (T3-01..T3-07) selesai: CRUD Barang, kode auto-generate, QR digital, foto upload, detail + riwayat, pencarian.
2026-06-16  Fase 4 (T4-01..T4-07, T4-09) selesai: service pengajuan + state machine + dual-approval + UI (PemindahanDialog, LaporanKerusakanDialog, PenghapusanDialog, ApprovalDialog) + halaman approval per role. T4-08 (notifikasi) dan T3-08 (Excel import) ditunda.
2026-06-16  Fase 5 (T5-01..T5-05, T5-07..T5-10) selesai: scan.repo + scan.service (baseline BAS-01, mulai sesi, matching SCN-02/03, selesai sesi SCN-05/06/09, tindak lanjut anomali SCN-08) + semua API routes + UI list sesi + halaman scanner aktif (html5-qrcode, feedback warna, tab baseline/hasil, dialog tindak lanjut anomali per-item). T5-06 (fallback manual) ditangguhkan sesuai SRS SCN-12 Tahap 2.
2026-06-16  Fase 6 (T6-01..T6-06) selesai: laporan.repo + API routes (/laporan/lokasi, /laporan/inventaris, /laporan/audit, /penghapusan) + halaman (laporan/index, laporan/inventaris, laporan/lokasi, laporan/opname, laporan/audit, penghapusan/histori-tahunan) + filter penangananKhusus di halaman barang inventaris.
2026-06-17  Fase 8 T8-03+T8-04+T8-06 selesai: error.tsx + loading.tsx di 4 route group; halaman /panduan 7 langkah in-app (KP-25); backup MySQL docs di ENVIRONMENT.md §6. T8-05 pending validasi manual user.
2026-06-17  Fase 8 T8-01+T8-02 selesai: dashboard.repo (stats global/area/pengguna) + api/dashboard + StatCard component + dashboard 4 role (PENGGUNA/AREA/INVENTARIS/PIMPINAN) + notifikasi backend (list/unread/read/markAll) + NotifikasiList component + halaman notifikasi 3 group + badge unread di sidebar + trigger notifikasi di pengajuan service. T8-03..T8-06 masih pending.
2026-06-17  Fase 7 (T7-01..T7-06) selesai: label.repo (upsertKonfigurasiLabel, createLogCetak, getBarangForLabel) + API routes (/label/config, /label/barang, /label/cetak, /export/barang) + halaman (inventaris)/label/page.tsx (konfigurasi + upload logo) + (area)/label/page.tsx (cetak batch QR, @media print CSS, crop marks, truncate nama) + (inventaris)/export/page.tsx (unduh XLSX via exceljs). Nav INVENTARIS diupdate: "Konfigurasi Label" + "Export Data". Proxy.ts: /export dan /laporan dan /penghapusan ditambahkan ke ROUTE_ROLES.
2026-06-17  Fix route conflicts: Next.js 16 parallel pages error — relokasi semua URL duplikat (/barang, /pengajuan, /notifikasi, /label) ke URL unik per role: (area)/barang→/area/barang, (pelapor)/barang→/pelapor/barang, (inventaris)/pengajuan→/inventaris/pengajuan, (inventaris)/label→/konfigurasi-label, notifikasi→(shared-notif). Buat route group (shared-notif), (shared-laporan), (shared-ops) untuk halaman lintas-role.
2026-06-17  UAT fixes: seed dev accounts (5 role), assign PJ/Laboran ke ruangan, buka GET API master data untuk PJ/LABORAN, fix sidebar double-active, fix print label CSS, buat halaman /lapor dan /maintenance, pindah /laporan ke shared-laporan untuk PIMPINAN akses. T8-06 ✅. Tersisa: T8-05 (validasi manual user).
2026-06-18  Fase 9 T9-01 selesai: Design system fondasi — 3 font (Plus Jakarta Sans, Inter, JetBrains Mono) via next/font; globals.css diubah ke indigo brand (#4F46E5) + slate neutral; dark mode (class-based) + toggle di user menu + anti-FOUC script; shadow/radius/animation tokens (shimmer, fade-up); metadata "Inventaris Fakultas".
2026-06-18  Fase 9 T9-02 selesai: Komponen shared — Card baru (rounded-xl, shadow-sm); Skeleton shimmer; Sidebar (indigo-50 active, left indicator 3px, rounded-xl items); AppShell (sidebar 264px, topbar 64px sticky backdrop-blur, brand icon); StatCard (icon tint circle, tabular-nums, hover shadow); DataTable (skeleton loading, zebra rows, rounded-xl, uppercase headers); EmptyState (icon in muted box, children slot); Toast (top-right, semantic colors, shadow-md); error.tsx (icon in tint box, font-display heading); loading.tsx (skeleton grid pattern) — semua 7 route groups.
2026-06-18  Fase 9 T9-03 selesai: Layar signature — Login split (gradient indigo→violet + tagline + fitur); Dashboard 4 role (font-display heading, skeleton loading, count-up animasi angka); Detail Barang (card sections rounded-xl, timeline vertikal, badge inline header, skeleton state).
2026-06-18  Fase 9 T9-04 selesai: Motion — page transition (framer-motion fade+slide 320ms, template.tsx 7 route groups); hover kartu (-translate-y-0.5 + shadow-md); stagger tabel (fade-up 30ms per row, max 10); prefers-reduced-motion global override di globals.css.
2026-06-18  Fase 10 T10-02 selesai: SaaS Dashboard Retrofit §14 — Sidebar filled indigo gradient (teks putih, active pill putih+shadow, user info+initials di bawah); Topbar (avatar initials+nama+role, bell icon); DataTable borderless (bg-card, border-b tipis, hover muted/30, h-14 rows); Users page (3 StatCards total/aktif/pending, avatar initials di kolom nama, status pill dot+tint, role badge soft).
```