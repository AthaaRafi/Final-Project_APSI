# TESTING

# TESTING — Rencana Uji & Data Seed

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Strategi verifikasi + data awal untuk menguji 5 role. Aturan yang diuji bersumber dari `SRS.md`; kriteria penerimaan ada di SRS `KP-01..25`.
> 

---

## 1. Strategi Uji

- **Wajib bersih sebelum task ditandai selesai:** `npm run typecheck` & `npm run lint`.
- **Prioritas pengujian (MVP):** verifikasi **alur kritis** secara manual di browser (lihat §3). Unit test untuk **service** (aturan bisnis) ditambah bertahap pada logika rawan (matching scan, dual-approval, kategori approval, generate kode barang).
- **Yang tidak bisa dijalankan agent** (butuh MySQL lokal/kamera): agent menyebutkan langkah + command, **user** menjalankan.
- Backend diutamakan: aturan bisnis diuji di service, bukan lewat UI saja.

---

## 2. Data Seed (`prisma/seed.ts`)

Seed **tidak** membuat akun INVENTARIS (lewat Setup Wizard). Seed mengisi master contoh:

- **Gedung:** 1 (mis. Gedung A).
- **Ruangan:** minimal 3 — `R201` (KELAS), `R202` (KELAS), `LAB-NET` (LABORATORIUM); semua punya `kode_ruangan`, `nama_ruangan`, `lantai`, `gedung_id`.
- **Jenis barang:** MEJA, KURSI, AC, KOMPUTER, APAR (AC/APAR dengan interval default maintenance).
- **Kategori approval:** “Elektronik” (wajib approval) & “Mebel” (tidak wajib).
- **Barang contoh:** beberapa per ruangan dengan kode unik (`MEJA-2025-R201-0001`, dst), kondisi BAIK, status NORMAL, flag BELUM, QR Barang dibuat otomatis.
- **KonfigurasiLabel:** 1 baris default.

---

## 3. Akun Demo (dibuat setelah Setup Wizard / via FA-11)

| Role | Email (contoh) | Cakupan |
| --- | --- | --- |
| INVENTARIS | [inventaris@uns.ac.id](mailto:inventaris@uns.ac.id) | Global (dibuat via Setup Wizard pertama) |
| PJ_RUANG | [pjruang@staff.uns.ac.id](mailto:pjruang@staff.uns.ac.id) | Di-assign R201, R202 |
| LABORAN | [laboran@staff.uns.ac.id](mailto:laboran@staff.uns.ac.id) | Di-assign LAB-NET |
| PENGGUNA | [civitas@student.uns.ac.id](mailto:civitas@student.uns.ac.id) | Pelapor (tanpa area) |
| PIMPINAN | [pimpinan@staff.uns.ac.id](mailto:pimpinan@staff.uns.ac.id) | Read-only global |

> Password demo diisi user saat membuat akun; jangan hardcode/commit kredensial.
> 

---

## 4. Skenario Uji Kritis (regresi)

### 4.1 Auth & Role

- Register email non-UNS -> ditolak. Register email UNS -> verifikasi -> `ACTIVE` PENGGUNA.
- Login tiap role -> redirect benar (`/dashboard`, `/area`, `/inventaris`, `/supervisor`).
- 5 login gagal -> lock 5 menit. Nonaktifkan akun -> force logout request berikutnya.
- Akses langsung URL role lain -> ditolak backend (bukan sekadar menu disembunyikan).

### 4.2 Barang & Master

- Buat barang -> kode unik & QR Barang otomatis. Kode duplikat -> ditolak.
- PENGGUNA telusur global barang (read-only); tak bisa POST/PUT/DELETE.
- Soft delete barang -> hilang dari list normal, masih ada di DB.

### 4.3 Pemindahan (kategori approval)

- Kategori tidak wajib approval -> langsung tercatat, lokasi aktual berubah, riwayat tertulis.
- Kategori wajib, dalam 1 area -> 1 approval PJ cukup.
- Antar-area -> butuh approval PJ asal & PJ tujuan (urutan bebas); pindah hanya saat keduanya setuju; tolak salah satu -> DITOLAK.
- Area tanpa PJ -> Inventaris memproses (tercatat sebagai fallback).

### 4.4 Laporan Kerusakan & Perawatan

- Lapor via scan/upload QR auto-isi barang; via manual juga bisa. Routing ke PJ/Laboran area.
- PJ tetapkan kondisi (Rusak Ringan/Berat) + tindak lanjut. Rusak Berat -> arah usulan penghapusan.
- Tolak laporan -> alasan wajib. Boleh >1 laporan aktif per barang.
- Preventif: jadwal default per jenis (Inventaris) + override per unit (PJ); jatuh tempo -> status Terjadwal Perawatan + reminder. **Opname tidak memicu perawatan.**

### 4.5 Stock Opname (Scan Cepat)

- Mulai sesi -> baseline = barang terdaftar ruangan. Matching: cocok/tidak cocok (lokasi seharusnya)/tidak terdaftar (target < 1 dtk).
- Jeda lalu lanjut sesi; auto-save tiap scan.
- Selesai -> barang terdaftar tak terscan -> status HILANG; barang asing -> dicatat & ditandai. Sesi `SELESAI` **tidak bisa diubah**.
- Anomali tetap muncul di Laporan Hasil Scan walau lokasi sudah diperbaiki.

### 4.6 Penghapusan

- PJ/Laboran ajukan (rusak berat / usang) + bukti. Civitas **tidak** bisa mengajukan.
- Inventaris validasi: setuju -> status Diajukan Hapus + masuk histori tahunan; tolak -> alasan wajib. Tidak ada eksekusi fisik / auto-submit.

### 4.7 Notifikasi, Pantau, Export

- Perubahan status memicu notifikasi in-app + badge; tandai dibaca / semua dibaca.
- Pengajuan Saya: daftar gabungan + filter; batalkan saat masih menunggu.
- Export daftar barang (Excel/PDF) jalan; **tidak** ada pengiriman otomatis ke universitas.

---

## 5. Checklist Verifikasi Manual (sebelum rilis fase)

- [ ]  `typecheck` & `lint` bersih.
- [ ]  Login + redirect 5 role.
- [ ]  Pemindahan 1-area & antar-area (dual approval).
- [ ]  Stock Opname matching + sesi SELESAI permanen + barang HILANG.
- [ ]  Penghapusan PJ -> Inventaris (Civitas ditolak).
- [ ]  Notifikasi in-app + pembatalan saat menunggu.
- [ ]  Export tanpa auto-submit.
- [ ]  Soft delete barang.