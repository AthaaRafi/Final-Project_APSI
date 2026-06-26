# Log Perubahan

Dokumen ini mencatat perubahan signifikan yang dilakukan selama development, beserta alasan dan konteks error-nya.

---

## 2026-06-17 — Fix Route Conflict & Bug Report Inventaris

### P-01: Fix "Parallel Pages Same Path" Build Error

**Masalah:** Next.js 16 menolak build karena beberapa route group memiliki `page.tsx` yang resolve ke URL yang sama. Error: `You cannot have two parallel pages that resolve to the same path`.

**Konflik yang ditemukan:**
| URL | Route Groups | 
|---|---|
| `/barang` | `(area)`, `(inventaris)`, `(pelapor)` |
| `/barang/[id]` | `(area)`, `(inventaris)`, `(pelapor)` |
| `/notifikasi` | `(area)`, `(inventaris)`, `(pelapor)` |
| `/pengajuan` | `(inventaris)`, `(pelapor)` |
| `/label` | `(area)`, `(inventaris)` |

**Solusi:** Setiap URL dibuat unik dengan menambahkan prefix sesuai role:

| Sebelum | Sesudah | Penjelasan |
|---|---|---|
| `(area)/barang/` → URL `/barang` | `(area)/area/barang/` → URL `/area/barang` | Nav PJ/LABORAN sudah pakai `/area/barang` |
| `(area)/barang/[id]/` → URL `/barang/[id]` | `(area)/area/barang/[id]/` → URL `/area/barang/[id]` | Konsisten dengan list page |
| `(area)/label/` → URL `/label` | `(area)/area/label/` → URL `/area/label` | Nav PJ/LABORAN diupdate |
| `(pelapor)/barang/` → URL `/barang` | `(pelapor)/pelapor/barang/` → URL `/pelapor/barang` | Nav PENGGUNA diupdate |
| `(pelapor)/barang/[id]/` → URL `/barang/[id]` | `(pelapor)/pelapor/barang/[id]/` → URL `/pelapor/barang/[id]` | Konsisten |
| `(pelapor)/pengajuan/` → URL `/pengajuan` | `(pelapor)/pelapor/pengajuan/` → URL `/pelapor/pengajuan` | Nav PENGGUNA diupdate |
| `(inventaris)/label/` → URL `/label` | `(inventaris)/konfigurasi-label/` → URL `/konfigurasi-label` | Nama lebih deskriptif |
| `(inventaris)/pengajuan/` → URL `/pengajuan` | `(inventaris)/inventaris/pengajuan/` → URL `/inventaris/pengajuan` | Nav INVENTARIS diupdate |
| `(area)/notifikasi/` + `(inventaris)/notifikasi/` + `(pelapor)/notifikasi/` | `(shared-notif)/notifikasi/` → URL `/notifikasi` | Satu halaman shared, layout pakai `requireAuth()` |

**File yang diubah:**
- `src/lib/nav-config.ts` — semua href diupdate sesuai URL baru
- `src/proxy.ts` — route roles diupdate (tambah `/pelapor`, `/konfigurasi-label`, `/notifikasi`; hapus `/label`, `/pengajuan` generik)
- `src/app/(inventaris)/panduan/page.tsx` — link Konfigurasi Label dari `/label` ke `/konfigurasi-label`
- `src/app/(shared-notif)/layout.tsx` — layout baru dengan `requireAuth()` (tanpa role spesifik), pass role ke AppShell
- Semua page.tsx dipindah ke lokasi baru (lihat tabel di atas)
- File lama dihapus

---

### P-02: Fix `/verify` Suspense Boundary Error

**Masalah:** `next build` gagal dengan error: `useSearchParams() should be wrapped in a suspense boundary at page "/verify"`.

**Alasan:** Next.js 16 mewajibkan `useSearchParams()` dibungkus `<Suspense>` untuk SSR/prerender. Halaman `/verify` memanggil `useSearchParams()` langsung di komponen page.

**Solusi:** Pisahkan logic ke komponen `VerifyContent` yang dibungkus `<Suspense fallback={...}>` di page default export.

**File:** `src/app/(auth)/verify/page.tsx`

---

### P-03: Tambah Akun Dev di Seed

**Masalah:** User tidak bisa login karena harus register → verifikasi email → tapi SMTP belum dikonfigurasi.

**Solusi:** Tambahkan 5 akun dev di `prisma/seed.ts` dengan password yang sudah di-hash (bcrypt cost 10), status `ACTIVE`, `emailVerifiedAt` terisi, sehingga bisa langsung login tanpa verifikasi.

| Email | Password | Role |
|---|---|---|
| `admin@uns.ac.id` | `admin123` | INVENTARIS |
| `pj@uns.ac.id` | `pj123` | PJ_RUANG |
| `laboran@uns.ac.id` | `laboran123` | LABORAN |
| `pengguna@uns.ac.id` | `pengguna123` | PENGGUNA |
| `pimpinan@uns.ac.id` | `pimpinan123` | PIMPINAN |

**File:** `prisma/seed.ts`

---

### P-04: Ganti Header Kolom "Aksi" → "Kode QR" di Tabel Barang Inventaris

**Masalah:** User request — kolom terakhir di tabel Data Barang (role INVENTARIS) labelnya "Aksi", user ingin diganti "Kode QR" karena isinya tombol QR dan nonaktifkan.

**File:** `src/app/(inventaris)/barang/page.tsx` — line header kolom `actions`

---

### P-05: Fix `/scan` Forbidden untuk INVENTARIS

**Masalah:** Halaman `/scan` (Scan Cepat) yang dilink dari Panduan Setup (`/panduan` step 7) mengembalikan error 403 "Anda tidak memiliki izin" untuk role INVENTARIS.

**Alasan:** `/scan` ada di route group `(area)` yang layout-nya `requireRole("PJ_RUANG", "LABORAN")`. INVENTARIS diizinkan di `proxy.ts` tapi ditolak di server-side layout.

**Solusi:** Tambahkan `"INVENTARIS"` ke `requireRole()` di `src/app/(area)/layout.tsx`.

**File:** `src/app/(area)/layout.tsx`

---

### P-06: Catatan — Error "Terjadi Kesalahan" / "Unexpected token '<'" pada Master Data, Label Config, Export

**Gejala:** Saat menekan "Simpan" di form Gedung/Jenis Barang, Konfigurasi Label, atau Export Data, muncul error generik.

**Investigasi:** Semua API backend ditest langsung dan berjalan sempurna:
- `POST /api/master/gedung` → 201 Created ✓
- `GET /api/label/config` → 200 OK ✓
- `PUT /api/label/config` (multipart) → perlu test browser
- `GET /api/export/barang` → 200 OK, return XLSX ✓

**Kemungkinan penyebab:**
1. Dev server belum di-restart setelah perubahan route structure (P-01). **Solusi: restart `npm run dev`.**
2. Cookie session expired/invalid setelah perubahan. **Solusi: logout lalu login ulang.**
3. Browser cache halaman lama. **Solusi: hard refresh (Ctrl+Shift+R).**

Jika masalah masih muncul setelah restart + re-login, perlu investigasi lebih lanjut via browser DevTools Network tab.

---

### P-07: Buat Halaman Jadwal Maintenance (`/maintenance`)

**Masalah:** Menu "Jadwal Maintenance" di sidebar INVENTARIS mengarah ke `/maintenance`, tapi halaman belum pernah dibuat — menghasilkan 404.

**Solusi:** Buat full stack fitur Jadwal Maintenance Preventif (MTC-05/FA-25):

- `src/server/repositories/maintenance.repo.ts` — CRUD query Prisma untuk model `JadwalMaintenance`
- `src/lib/validation/maintenance.ts` — schema Zod untuk create/update jadwal
- `src/app/api/maintenance/route.ts` — GET (list) + POST (create), role PJ_RUANG/LABORAN/INVENTARIS untuk GET, INVENTARIS saja untuk POST
- `src/app/api/maintenance/[id]/route.ts` — PUT (update interval) + DELETE, role INVENTARIS
- `src/app/(shared-ops)/layout.tsx` — layout baru untuk halaman shared yang diakses PJ_RUANG/LABORAN/INVENTARIS, pakai `requireRole` ketiga role
- `src/app/(shared-ops)/maintenance/page.tsx` — halaman CRUD tabel jadwal maintenance dengan form dialog (pilih jenis barang + interval bulan)
- `src/types/master.ts` — tambah interface `JadwalMaintenanceItem`
- `src/lib/api/query-keys.ts` — tambah key `maintenance.list()`

**Catatan:** Route group `(shared-ops)` dibuat terpisah dari `(area)` dan `(inventaris)` agar URL `/maintenance` bisa diakses oleh ketiga role tanpa konflik layout.

---

### P-08: Fix Halaman `/approval` 404 — URL Mismatch

**Masalah:** Nav PJ_RUANG/LABORAN mengarah ke `/area/approval`, tapi halaman ada di `(area)/approval/` yang URL-nya `/approval` (tanpa prefix).

**Solusi:** Pindah `(area)/approval/page.tsx` → `(area)/area/approval/page.tsx` agar URL menjadi `/area/approval` sesuai nav config.

**File:** `src/app/(area)/area/approval/page.tsx` (dipindah dari `src/app/(area)/approval/page.tsx`)

---

### P-09: Fix Sidebar — Dua Item Aktif Sekaligus (Efek Hitam Ganda)

**Masalah:** Saat PJ_RUANG buka `/area/barang`, sidebar meng-highlight **dua** item: "Dashboard Area" (`/area`) dan "Barang Area" (`/area/barang`), keduanya berwarna hitam. Ini terjadi karena logika `pathname.startsWith(item.href + "/")` menyebabkan `/area/barang` match `/area/` juga.

**Solusi:** Tambah logika "more specific match" — jika ada item sidebar lain yang lebih spesifik cocok dengan pathname saat ini, item parent tidak aktif.

**File:** `src/components/layout/sidebar.tsx`

---

### P-10: Seed — Assign PJ_RUANG dan LABORAN ke Ruangan

**Masalah:** Akun dev `pj@uns.ac.id` (PJ_RUANG) dan `laboran@uns.ac.id` (LABORAN) belum di-assign ke ruangan mana pun. Akibatnya semua query barang dan dashboard area return kosong/0.

**Solusi:** Tambahkan `UserRuangan` upsert di seed:
- PJ_RUANG → R201, R202
- LABORAN → LAB-NET

**File:** `prisma/seed.ts`

---

### P-11: Fix API Master Data GET — Buka Akses untuk PJ_RUANG/LABORAN

**Masalah:** Dropdown "Jenis Barang", "Kategori Approval", "Lokasi Terdaftar" di form Tambah Barang (role PJ_RUANG) tidak bisa diklik/kosong. API GET `/api/master/ruangan`, `/api/master/jenis-barang`, `/api/kategori-approval`, `/api/master/gedung` hanya mengizinkan role INVENTARIS.

**Alasan:** PJ_RUANG dan LABORAN perlu membaca data master untuk form barang, cetak label, dan dropdown lainnya (read-only). Hanya POST/PUT/DELETE yang tetap INVENTARIS-only.

**Solusi:** Ubah `requireRole("INVENTARIS")` menjadi `requireRole("PJ_RUANG", "LABORAN", "INVENTARIS")` pada GET handler:
- `src/app/api/master/ruangan/route.ts`
- `src/app/api/master/jenis-barang/route.ts`
- `src/app/api/master/gedung/route.ts`
- `src/app/api/kategori-approval/route.ts`

---

### P-12: Fix Print Label Kosong — CSS Print Tidak Menampilkan Label

**Masalah:** Saat menekan cetak di halaman Cetak Label (`/area/label`), PDF hasil print hanya halaman kosong. Label QR tidak muncul.

**Alasan:** CSS `body > * { display: none !important; }` hanya menyembunyikan direct children body. Di Next.js App Router, `#label-print-area` bukan direct child body — dia deeply nested di dalam layout wrappers (`body > div > div > main > ... > #label-print-area`). Sehingga `display: block !important` pada `#label-print-area` tidak efektif karena parent-parentnya juga hidden.

**Solusi:** Ganti strategi CSS print:
- Gunakan `visibility: hidden` pada `body *` (bukan `display: none` pada `body > *`) — ini menyembunyikan semua elemen tanpa menghapus dari layout
- Set `visibility: visible` + `display: revert` khusus pada `#label-print-area` dan semua child-nya
- Posisikan `#label-print-area` dengan `position: fixed; left: 0; top: 0; width: 100%` agar mengisi halaman print

**File:** `src/app/(area)/area/label/page.tsx`

---

### P-13: Fix Dashboard Pengguna — Link 404 ke `/pengajuan` dan `/barang`

**Masalah:** Tombol "Lihat Pengajuan Saya" dan "Cari Barang" di dashboard pengguna mengarah ke `/pengajuan` dan `/barang` (URL lama). Setelah relokasi route, URL yang benar adalah `/pelapor/pengajuan` dan `/pelapor/barang`.

**Solusi:** Update href di dashboard dari `/pengajuan` → `/pelapor/pengajuan` dan `/barang` → `/pelapor/barang`.

**File:** `src/app/(pelapor)/dashboard/page.tsx`

---

### P-14: Buat Halaman `/lapor` — Lapor Kerusakan

**Masalah:** Menu "Lapor" di sidebar PENGGUNA dan PIMPINAN mengarah ke `/lapor` yang belum ada (404).

**Solusi:** Buat halaman `/lapor` di route group `(shared-notif)` (karena diakses PENGGUNA dan PIMPINAN). Halaman berisi pencarian barang — user mencari barang, klik untuk masuk ke detail, lalu buat laporan dari sana (sesuai flow SRS FU-06).

**File baru:**
- `src/app/(shared-notif)/lapor/page.tsx`

**File diubah:**
- `src/proxy.ts` — tambah `{ prefix: "/lapor", roles: ["PENGGUNA", "PIMPINAN"] }`

---

### P-15: Tambah Kolom Status di Tabel Barang Pengguna

**Masalah:** Tabel barang di halaman PENGGUNA hanya menampilkan kolom "Kondisi" tapi tidak "Status". Saat barang dilaporkan rusak, `statusBarang` berubah ke `DILAPORKAN_RUSAK` tapi user tidak bisa melihatnya karena kolom status tidak ditampilkan. User bingung kenapa kondisi masih "Baik" padahal sudah lapor.

**Catatan desain (SRS):** `kondisi` (BAIK/RUSAK_RINGAN/RUSAK_BERAT) dan `statusBarang` (NORMAL/DILAPORKAN_RUSAK/dst) **sengaja terpisah**. Kondisi di-update saat PJ memvalidasi, bukan saat pelaporan. Yang berubah saat lapor adalah `statusBarang` → `DILAPORKAN_RUSAK`.

**Solusi:** Tambahkan kolom "Status" di tabel barang pengguna yang menampilkan badge `STATUS_BARANG_LABEL`.

**File:** `src/app/(pelapor)/pelapor/barang/page.tsx`

---

### P-16: Fix Laporan PIMPINAN 404 — Pindah ke Shared Route Group

**Masalah:** Nav PIMPINAN mengarah ke `/supervisor/laporan` (lalu diubah ke `/laporan`), tapi halaman laporan ada di `(inventaris)` yang layout-nya `requireRole("INVENTARIS")` — PIMPINAN ditolak.

**Solusi:** Pindah seluruh `/laporan/*` dari `(inventaris)` ke route group baru `(shared-laporan)` dengan layout `requireRole("INVENTARIS", "PIMPINAN")`. Juga buka API `/api/laporan/audit` untuk PIMPINAN (sebelumnya hanya INVENTARIS). Update nav PIMPINAN dari `/supervisor/laporan` → `/laporan`.

**File baru:**
- `src/app/(shared-laporan)/layout.tsx` — layout shared INVENTARIS+PIMPINAN

**File dipindah:**
- `src/app/(inventaris)/laporan/*` → `src/app/(shared-laporan)/laporan/*`

**File diubah:**
- `src/lib/nav-config.ts` — nav PIMPINAN `/supervisor/laporan` → `/laporan`
- `src/app/api/laporan/audit/route.ts` — `requireRole("INVENTARIS")` → `requireRole("INVENTARIS", "PIMPINAN")`

---

### P-17: Perbaikan Email/OTP — Validasi Domain UNS Umum + Email Non-Blocking + Dev Fallback

**Masalah:** Alur register & lupa password gagal total ketika Mailtrap error (kredensial salah/timeout). Penyebabnya: `sendVerificationEmail`/`sendPasswordResetOtp` dipanggil dengan `await` tanpa penanganan error — jika SMTP gagal, seluruh request register/forgot ikut gagal sehingga user tidak terdaftar / OTP tidak pernah dibuat.

**Keputusan user:**
1. OTP/verifikasi dikirim sebagai email sungguhan (rencananya via Gmail SMTP + App Password).
2. Validasi email cukup mendeteksi domain `uns.ac.id` (apa pun subdomainnya: `student.`, `staff.`, `mhs.`, dst), bukan daftar hardcode 3 domain.
3. Register tetap pakai link verifikasi (tidak diubah ke OTP).

**Solusi:**
1. **`isAllowedEmailDomain`** — diubah dari `endsWith` daftar 3 domain menjadi pengecekan berbasis bagian domain email: lolos jika domain `=== "uns.ac.id"` atau `endsWith(".uns.ac.id")`. Lebih aman (tidak menerima `uns.ac.id` di local-part) dan lebih umum (semua subdomain UNS lolos).
2. **`sendMail`** — tidak lagi melempar error. Jika SMTP belum dikonfigurasi atau gagal kirim, isi email (termasuk link/OTP) di-log ke server console sebagai dev fallback, dan request tetap lanjut. Juga: `secure` otomatis `true` untuk port 465 (SMTPS), default port 587 (STARTTLS) agar kompatibel dengan Gmail.
3. Pesan error domain diperbarui: "Hanya email kampus UNS yang diterima (domain uns.ac.id)".

**File:**
- `src/server/services/auth.service.ts` — validasi domain digeneralkan + pesan error
- `src/lib/mail/index.ts` — email non-blocking + dev fallback + dukungan port 465/587

**Catatan setup (untuk Gmail SMTP):** isi `.env` dengan `MAIL_HOST="smtp.gmail.com"`, `MAIL_PORT="587"`, `MAIL_USER="<gmail kamu>"`, `MAIL_PASS="<App Password 16 digit>"`, `MAIL_FROM="Inventaris Fakultas <gmail kamu>"`. App Password butuh 2FA aktif di akun Google.
