# RULES

# RULES — Aturan Pengembangan (Boleh / Dilarang)

> **Status:** v2.0 (sinkron model 5-role + Stock Opname) · **Tanggal:** 12 Juni 2026
**Sifat:** Aturan keras (hard constraints). `AGENTS.md` / `CLAUDE.md` mengacu ke file ini.
**Dokumen terkait:** `SDD.md` · `SRS.md` · `DECISIONS.md`
> 

File ini adalah **batas-batas yang tidak boleh dilanggar** saat membangun aplikasi — baik oleh manusia maupun AI coding agent. Kalau ragu, **tanya dulu** sebelum menulis kode.

---

## 1. Aturan Proses Kerja

### ✅ Boleh / Harus

- **Push back kalau ada yang aneh** sebelum implementasi.
- **Klarifikasi sebelum implementasi besar** kalau requirement ambigu.
- **Update** `TASK_BREAKDOWN.md` **setiap mulai/selesai task.** Kerjakan urut sesuai fase (dependensi).
- **Catat keputusan penting di** `DECISIONS.md` (ADR) beserta alasannya.

### ❌ Dilarang

- **Dilarang refactor di luar scope task.** Kalau lihat masalah lain, catat di akhir response.
- **Dilarang menambah library/pattern/abstraction/dependency baru tanpa diskusi.**
- **Dilarang mengerjakan banyak fase sekaligus** sehingga sulit dilacak.
- **Dilarang membalik keputusan yang sudah dikunci di** `DECISIONS.md` tanpa diskusi.

---

## 2. Sumber Kebenaran (Source of Truth)

### ✅ Harus

- **Aturan bisnis = SRS.** Implementasi = SDD. Kalau kode & dokumen beda, perbaiki keduanya (di task yang sama).
- **Backend (service layer) = source of truth perilaku & kontrak API.** Frontend mengikuti.
- Prioritas: (1) perilaku service backend aktif, (2) kontrak yang dipakai frontend, (3) dokumen `docs/`.

### ❌ Dilarang

- **Dilarang menaruh aturan bisnis di frontend** sebagai satu-satunya pertahanan.
- **Dilarang membuat “fallback” di frontend untuk menutupi bug backend.**

---

## 3. Keamanan & RBAC (5 role)

### ✅ Harus

- Password selalu **hashed (bcrypt)**. JWT di **cookie httpOnly** (`inv_session`); `Secure` di production.
- Setiap endpoint cek **role (RBAC)** lewat `requireRole(...)` / `requireAuth()`.
- **1 akun = 1 role**: `PENGGUNA`/`PJ_RUANG`/`LABORAN`/`INVENTARIS`/`PIMPINAN`.
- `PJ_RUANG`/`LABORAN` hanya mengakses data **area yang di-assign** (`user_ruangan`). `PIMPINAN` read-only. `INVENTARIS` global + fallback tercatat.
- **Proteksi lockout:** tolak demote/nonaktif/hapus terhadap **INVENTARIS aktif terakhir** (FA-11).
- Validasi semua input di server (Zod) sebelum ke service.

### ❌ Dilarang

- **Dilarang print, expose, atau commit secret** (isi `.env`). Hanya `.env.example` yang boleh masuk repo.
- **Dilarang mengamankan hanya di UI.** Backend wajib menolak akses tak berizin.
- **Dilarang menonaktifkan validasi/otorisasi** demi “biar cepat jalan”.
- **Dilarang menulis query SQL mentah dari input user.** Gunakan Prisma (parameterized).
- **Dilarang membuat akun dengan role rangkap.**

---

## 4. Database & Migrasi

### ✅ Harus

- Skema di `prisma/schema.prisma` (source of truth schema). Migrasi **forward-only** & aman untuk data existing.
- Soft delete domain barang: isi `deletedAt`/`deletedBy`; list normal filter `deletedAt IS NULL`.
- Kode barang & kode master (ruangan, jenis, gedung) **wajib unik**.
- Kolom ruangan = `kode_ruangan` & `nama_ruangan` (seragam dengan payload QR).
- Audit fields (`createdBy`/`updatedBy`) diisi dari sesi login, bukan input bebas.
- `Barang` punya 2 relasi `Ruangan` (terdaftar & aktual) dengan nama relasi eksplisit.

### ❌ Dilarang

- **Dilarang mengedit migrasi lama** yang sudah jadi history (tambah migrasi baru).
- **Dilarang hard delete baris barang** (pakai soft delete).
- **Dilarang menyimpan kode barang duplikat.**
- **Dilarang memakai nama kolom lama** `kode_ruang`/`nama_ruang`.

---

## 5. API & Kontrak

### ✅ Harus

- Semua akses DB lewat **repository (Prisma)**; semua aturan bisnis lewat **service**; Route Handler tetap tipis.
- Response sukses/error ikut format SDD §6.1 (envelope `data`, error RFC 7807-style). Paginasi `page` 0-based, `size` cap 100.
- Semua HTTP request frontend lewat `lib/api/client.ts`.

### ❌ Dilarang

- **Dilarang menaruh query Prisma langsung di komponen React / Route Handler.**
- **Dilarang mengubah kontrak API tanpa** menyesuaikan backend -> tipe frontend -> komponen -> dokumen.

---

## 6. Frontend

### ✅ Harus

- Pakai komponen shared (`DataTable`, `FormField`, `StatusBadge`, dll). Kolom list/detail/form **konsisten**.
- Data fetching pakai **React Query**; mutasi -> **invalidate query** spesifik (bukan reload halaman).
- Query yang butuh prasyarat (scope/role/id) pakai `enabled` + guard/empty state eksplisit. Warna status konsisten (UIUX_FLOW).

### ❌ Dilarang

- **Dilarang pakai** `localStorage`/`sessionStorage` **untuk menyimpan token** (token di cookie httpOnly).
- **Dilarang reload halaman** sebagai mekanisme refresh data.
- **Dilarang bikin query key ad-hoc** (taruh di `lib/api/query-keys.ts`).

---

## 7. File, Foto, & QR

### ✅ Harus

- Upload file lewat lapisan `lib/storage`; file di luar `public/`, diserve via Route Handler ber-otorisasi.
- Foto dikompres; maks 2 MB.
- QR dibuat otomatis saat barang dibuat/import. QR adalah **entitas terpisah** (`qr_code`, tipe `BARANG`/`RUANGAN`), payload JSON `TinyText` (maks 3KB), satu QR `aktif` per entitas.

### ❌ Dilarang

- **Dilarang menaruh file upload langsung di** `public/` (bypass otorisasi).
- **Dilarang hardcode path penyimpanan** (pakai abstraksi `storage` + `STORAGE_DIR`).

---

## 8. Aturan Domain Spesifik (dari SRS)

### ❌ Dilarang (aturan bisnis yang tidak boleh dilanggar)

- **Dilarang mengirim data otomatis ke universitas / SIMAK-BMN.** Hanya export manual (KP-19).
- **Dilarang mengeksekusi penghapusan fisik** dari sistem (hanya rekomendasi & status internal).
- **Dilarang mengubah hasil sesi Stock Opname** setelah `SELESAI` (snapshot permanen, SCN-06).
- **Dilarang melewati cek kategori approval** saat pemindahan (KAT-02).
- **Dilarang memindah barang antar-area tanpa dual-approval** (PJ asal & tujuan) bila kategori wajib approval (PMD-07).
- **Dilarang membiarkan satu barang punya 2 pengajuan aktif yang bertentangan** (PNG-02).
- **Dilarang membiarkan transisi status di luar state machine** (SRS §5.1).
- **Dilarang membiarkan PENGGUNA/Civitas mengajukan penghapusan** (hanya PJ_RUANG/LABORAN; validasi oleh INVENTARIS).
- **Dilarang memicu perawatan otomatis dari Stock Opname** (perawatan hanya dari laporan kerusakan & jadwal preventif).

### ✅ Harus

- Pemindahan kategori **tidak wajib approval** -> langsung tercatat (`LANGSUNG_TERCATAT`).
- Barang **hilang** saat opname selesai -> `statusBarang = HILANG` lebih dulu (penghapusan menyusul terpisah, `sumber = STOCK_OPNAME`).
- Anomali scan tetap tercatat di laporan scan walau lokasi sudah diperbaiki (RPT-04).
- `flag_verifikasi` **di-reset ke** `BELUM` **tiap awal tahun anggaran**.
- Histori penghapusan dikelompokkan per tahun (HPS-03).

---

## 9. Testing & Verifikasi

### ✅ Harus

- Sebelum tandai task selesai: `npm run typecheck` & `npm run lint` bersih.
- Verifikasi alur kritis (login+redirect 5 role, pemindahan 1-area vs antar-area, Stock Opname matching + sesi SELESAI, penghapusan PJ->Inventaris) sebelum dianggap selesai.
- Kalau ada perintah yang **tidak bisa dijalankan agent** (mis. butuh DB lokal), minta user menjalankan manual & sebutkan command-nya.

### ❌ Dilarang

- **Dilarang menandai task** `[x]` kalau DoD belum terpenuhi.
- **Dilarang mengklaim “sudah dites”** kalau belum benar-benar dijalankan.

---

## 10. Dokumentasi

### ✅ Harus

- Kalau ada perubahan perilaku/kontrak/aturan yang membuat dokumen (`SRS/SDD/AGENTS`) usang -> **update di task yang sama.**
- Isi `AGENTS.md` dengan aturan stabil lintas task; catat keputusan di `DECISIONS.md`.

### ❌ Dilarang

- **Dilarang membiarkan dokumen & kode berbeda** tanpa keterangan.