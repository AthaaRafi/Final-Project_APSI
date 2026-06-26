# UIUX_FLOW

# UIUX_FLOW — Desain UI/UX & Alur Layar

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Acuan **tampilan & navigasi**. Aturan bisnis ada di `SRS.md`, alur tingkat tinggi di `PRD.md` §7, teknis di `SDD.md`.
> 

---

## 1. Prinsip Desain

- **Operasional & data-first**, bukan marketing. Padat informasi, sedikit dekorasi.
- **Bahasa Indonesia** di seluruh UI & pesan error.
- **Mobile-first untuk Scan Cepat** (kamera HP/tablet); desktop-first untuk tabel & manajemen.
- **Konsistensi**: pakai komponen shared; urutan & nama kolom sama di list, detail, dan form domain yang sama.
- **Umpan balik jelas**: setiap aksi punya state loading / sukses / error (toast) + konfirmasi untuk aksi destruktif.

---

## 2. Sistem Visual

- **Tailwind CSS + shadcn/ui** (Radix), ikon `lucide-react`, toast `sonner`.
- Tipografi & spacing memakai default shadcn; jangan introduce design token baru tanpa diskusi.
- Layout 2 kolom: **Sidebar** (navigasi per role) + **Topbar** (judul halaman, lonceng notifikasi, menu akun).

---

## 3. Warna Status (KANONIK — dipakai di seluruh UI)

Komponen `StatusBadge`/`KondisiBadge` wajib memetakan nilai ke warna ini.

| Domain | Nilai | Warna |
| --- | --- | --- |
| Status Barang | Normal | Hijau |
| Status Barang | Dilaporkan Rusak | Oranye |
| Status Barang | Menunggu Validasi | Kuning |
| Status Barang | Dalam Perawatan | Biru |
| Status Barang | Terjadwal Perawatan | Ungu |
| Status Barang | Hilang | Merah |
| Status Barang | Diajukan Hapus | Abu-abu |
| Status Barang | Nonaktif | Abu-abu |
| Kondisi | Baik | Hijau |
| Kondisi | Rusak Ringan | Kuning |
| Kondisi | Rusak Berat | Merah |
| Hasil Scan | Cocok | Hijau |
| Hasil Scan | Tidak Cocok | Kuning |
| Hasil Scan | Tidak Terdaftar | Merah |
| Pengajuan | Menunggu | Kuning |
| Pengajuan | Disetujui / Selesai / Langsung Tercatat | Hijau |
| Pengajuan | Revisi | Oranye |
| Pengajuan | Ditolak | Merah |
| Pengajuan | Dibatalkan | Abu-abu |
| Flag Verifikasi | Terverifikasi | Hijau |
| Flag Verifikasi | Belum | Abu-abu |
| Flag Verifikasi | Anomali | Merah |

---

## 4. Shell & Navigasi per Role

Tiap role punya shell terpisah (route group). Sidebar hanya menampilkan menu yang diizinkan; backend tetap enforce.

- **(pelapor) — PENGGUNA** (`/dashboard`): Dashboard · Barang (telusur global) · Pengajuan Saya · Lapor · Notifikasi.
- **(area) — PJ_RUANG / LABORAN** (`/area`): Dashboard Area · Barang Area · Approval · Scan Cepat · Maintenance · Cetak Label · Notifikasi.
- **(inventaris) — INVENTARIS** (`/inventaris`): Dashboard Global · Master Data · Kategori Approval · Akun & Role · Laporan & Export · Histori Penghapusan · Jadwal Maintenance · Notifikasi.
- **(supervisor) — PIMPINAN** (`/supervisor`): Dashboard Pemantauan · Laporan (read-only) · Lapor.
- **(auth)**: Login · Register · Verifikasi Email · Lupa Password · Setup Wizard.

---

## 5. Peta Layar (Sitemap)

- **Publik:** `/login`, `/register`, `/verify`, `/forgot`, `/setup`.
- **PENGGUNA:** `/dashboard`, `/barang`, `/barang/[id]`, `/pengajuan`, `/pengajuan/baru`, `/lapor`.
- **AREA:** `/area`, `/area/barang`, `/area/approval`, `/scan`, `/scan/[sesiId]`, `/maintenance`, `/label/[ruanganId]/cetak`.
- **INVENTARIS:** `/inventaris`, `/master/(ruangan|gedung|jenis)`, `/kategori-approval`, `/users`, `/laporan`, `/penghapusan`, `/maintenance`.
- **PIMPINAN:** `/supervisor`, `/supervisor/laporan`.

---

## 6. Layar Kunci (wireframe deskriptif)

### 6.1 Login & Onboarding

- **Login:** field email UNS + password, link “Lupa password” & “Daftar”. Submit -> redirect sesuai role.
- **Register:** email UNS (validasi domain), nama, password; kirim verifikasi email (token 24 jam).
- **Setup Wizard** (`/setup`): hanya muncul saat DB kosong; buat akun INVENTARIS pertama, lalu diblokir.

### 6.2 Detail Barang (FU-04)

- Header: nama + kode barang + `StatusBadge` + `KondisiBadge`.
- Info: jenis, penguasaan, lokasi terdaftar vs lokasi aktual, QR (gambar).
- Tab: Info · Timeline/Riwayat (FA-08).
- Tombol aksi cepat sesuai role: **Lapor Kerusakan** (FU-06), **Ajukan Pemindahan** (FU-05). Field jadwal maintenance disembunyikan untuk PENGGUNA/PIMPINAN.

### 6.3 Scan Cepat / Stock Opname (FA-12) — mobile

- Pilih area -> tombol besar **“Mulai Scan Cepat”** (mirip QRIS) -> kamera aktif.
- Tiap scan: banner besar **hijau** (cocok) / **kuning** (tidak cocok, tampilkan lokasi seharusnya) / **merah** (tidak terdaftar) + counter berjalan.
- Sesi bisa **dijeda & dilanjutkan**; auto-save tiap scan.
- Layar **Selesai**: ringkasan (terverifikasi, hilang, asing) -> **tindak lanjut batch** (pilih banyak item). Barang hilang -> set Hilang; barang asing -> catat & tandai. Setelah `SELESAI`, sesi read-only (snapshot permanen).

### 6.4 Lapor Kerusakan (FU-06 / §7.7 PRD)

- Pilih jalur: **Scan/Upload QR** (auto-isi barang) atau **cari manual**.
- Form: deskripsi (wajib), foto (opsional) -> kirim. Routing otomatis ke PJ/Laboran area.

### 6.5 Pengajuan Pemindahan (FU-05 / §7.1 PRD)

- Pilih barang -> lokasi tujuan + alasan. Sistem cek kategori approval; tampilkan info apakah butuh approval / langsung tercatat. Antar-area: tampilkan status ringkas “Menunggu persetujuan” (dual-approval di belakang layar).

### 6.6 Approval (AREA) & Validasi Penghapusan (INVENTARIS)

- Tabel antrian: barang, pengaju, jenis, tanggal, aksi Setujui/Tolak/Revisi. Penolakan wajib alasan.

### 6.7 Manajemen Akun & Role (FA-11, INVENTARIS)

- DataTable user + filter role/status. Aksi: ubah role (1 akun = 1 role), assign/lepas area (PJ/Laboran), aktif/nonaktif. Proteksi lockout INVENTARIS terakhir (tombol disabled + tooltip).

### 6.8 Pengajuan Saya (FU-08) & Notifikasi (FU-09)

- **Pengajuan Saya:** satu daftar gabungan (pemindahan + laporan) + filter jenis/status + badge warna. Batalkan saat masih menunggu.
- **Notifikasi:** lonceng + badge belum dibaca; daftar terbaru di atas; klik -> detail + auto tandai dibaca; aksi “Tandai semua dibaca”.

### 6.9 Cetak Label (FA-19)

- Grid label 6×2.5 cm, 2 kolom; CSS `@media print` (crop marks). Ctrl+P -> Save as PDF. Logo dari konfigurasi.

---

## 7. Komponen Domain (shared)

- `StatusBadge`, `KondisiBadge`, `MatchingBadge` — patuh tabel §3.
- `ScanFeedback` — banner besar hijau/kuning/merah + suara/getar opsional.
- `DataTable` — TanStack Table + filter + paginasi server (0-based, size cap 100).
- `ConfirmDialog` — aksi destruktif. `EmptyState`, `Timeline` (riwayat barang).

---

## 8. Pola Interaksi

- Loading skeleton untuk tabel/detail; empty state eksplisit; error pakai pesan dari envelope RFC 7807.
- Mutasi -> invalidate query key, **bukan reload**. Form: pesan error per-field (Bahasa Indonesia).
- Query dengan prasyarat (scope/role/id) pakai `enabled` + guard.