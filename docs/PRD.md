# PRD

# PRD — Sistem Inventaris Barang Fakultas

> **Status:** Update v1.2 · **Tanggal:** 9 Juni 2026
**Sumber:** Turunan dari dokumen SKSI v3.5 (pendekatan CORLAKS).
**Dokumen terkait:** [`SRS.md`](./SRS.md) · [`SDD.md`](./SDD.md) · [`UIUX_FLOW.md`](./UIUX_FLOW.md) · [`TASK_BREAKDOWN.md`](./TASK_BREAKDOWN.md) · [`RULES.md`](./RULES.md) · [`AGENTS.md`](../AGENTS.md)
> 

PRD ini menjelaskan **apa** yang dibangun dan **untuk siapa**. Detail aturan/validasi ada di SRS, detail teknis ada di SDD.

---

## 1. Ringkasan Produk

Aplikasi web responsif untuk mengelola inventaris barang di lingkungan fakultas. Setiap barang punya **kode unik + QR**, dan setiap **ruangan punya daftar barang terdaftar** sebagai baseline verifikasi. Pengelola area (PJ Ruang/Laboran) bisa melakukan **Scan Cepat** (mirip scan QRIS) untuk verifikasi fisik barang per ruangan secara real-time.

Sistem ini **mandiri (standalone)**: tidak terhubung otomatis ke SIMAK-BMN atau sistem universitas. Alur berhenti di **Inventaris**, yang membuat laporan/daftar barang secara manual untuk diserahkan ke universitas.

### Masalah yang diselesaikan

- Data administrasi sering tidak sama dengan kondisi fisik di lapangan.
- Barang berpindah ruangan tanpa tercatat.
- Kerusakan tidak dilaporkan sistematis.
- Verifikasi fisik manual memakan waktu.

### Solusi inti

1. Pendataan barang akurat per ruangan (kode unik + QR).
2. **Scan Cepat** verifikasi fisik per ruangan dengan matching real-time.
3. Pengajuan pemindahan, pemeliharaan, dan usulan penghapusan.
4. Laporan internal + export daftar barang untuk universitas (manual).

---

## 2. Tujuan & Metrik Keberhasilan

| Tujuan | Indikator Keberhasilan |
| --- | --- |
| Pendataan barang akurat | Setiap barang punya kode unik (0 duplikat) dan QR digital |
| Verifikasi fisik cepat | Satu ruangan (10–20 barang) bisa diverifikasi < 10 menit |
| Alur pengajuan jelas | User bisa ajukan & memantau status tanpa bertanya manual |
| Data lapangan sinkron | Anomali lokasi terdeteksi & bisa diperbaiki dari hasil scan |
| Siap lapor universitas | Inventaris bisa export daftar barang (Excel/PDF) kapan saja |

Kriteria penerimaan teknis (uji terima) didetailkan di **SRS** sebagai `KP-01` … `KP-25`.

---

## 3. Lingkup Produk

### Termasuk (In Scope)

- Pendataan barang (kode unik, QR), master ruangan/jenis/gedung.
- Pengajuan pemindahan, pemeliharaan, usulan penghapusan.
- Approval admin berbasis **kategori barang** (wajib / tidak wajib approval).
- **Scan Cepat** verifikasi fisik per ruangan (matching real-time) sebagai alat **Stock Opname** terjadwal.
- **Histori tahunan penghapusan** (kebijakan universitas: setahun sekali).
- Cetak **QR label batch per ruangan** (PDF A4).
- Laporan internal + **export daftar barang** untuk universitas (manual).
- Dua laporan terpisah: **Laporan Lokasi Barang** (real-time) & **Laporan Hasil Verifikasi Scan** (per sesi/arsip).

### Tidak Termasuk (Out of Scope)

- Integrasi otomatis dengan SIMAK-BMN / sistem universitas (hanya export manual).
- Proses pengadaan barang.
- Penilaian akuntansi aset / penyusutan.
- Eksekusi penghapusan fisik (sistem hanya merekomendasi).
- Pembuatan surat resmi universitas (admin buat manual di luar sistem).
- Kebijakan hukum penghapusan.

### Batasan Alur (penting)

Sistem berhenti di **Inventaris** → Inventaris export daftar → buat surat manual → diserahkan ke universitas. **Tidak ada auto-submit.**

---

## 4. Pengguna & Role

> **Update v1.2:** Model diubah dari terpusat menjadi **terdesentralisasi**. Operasional ditangani per-area oleh **PJ Ruang** (ruang kelas) & **Laboran** (laboratorium). **Inventaris** menjadi perekap/pengawas data (laporan tahunan, export, kelola akun) dengan **akses cadangan tercatat** bila area tanpa PJ. **Pimpinan Fakultas** sebagai supervisor read-only. Semua segmen tetap bisa melapor.
> 

| Role | Cara Mendapatkan | Hak Akses | Cakupan |
| --- | --- | --- | --- |
| **PENGGUNA (Civitas Akademik)** | Sign up mandiri dengan email kampus UNS (role default) | Cari & lihat detail barang, lapor kerusakan/pemeliharaan, ajukan pemindahan, ajukan usulan hapus, lihat status pengajuan & status barang, terima notifikasi. | Seluruh sistem (sebagai pelapor) |
| **PJ RUANG** | Civitas yang di-promote Inventaris + di-assign satu/lebih ruang kelas (many-to-many) | Semua hak Civitas + **memproses laporan** area-nya, kelola data barang, fiksasi, Scan Cepat, generate/cetak QR. | Ruang kelas yang di-assign |
| **LABORAN** | Civitas yang di-promote Inventaris + di-assign satu/lebih laboratorium (many-to-many) | Sama seperti PJ Ruang, tetapi untuk **laboratorium** yang ditanggungjawabi. | Laboratorium yang di-assign |
| **INVENTARIS** | Bootstrap awal (Setup Wizard) atau di-grant Inventaris lain | Rekap & log seluruh data, laporan tahunan, histori penghapusan, export daftar ke universitas, kelola master data global, kelola akun & role (FA-11). **Akses cadangan tercatat** untuk memproses area tanpa PJ aktif. | Lintas area (level agregat/data) |
| **PIMPINAN FAKULTAS** | Di-grant oleh Inventaris | Memantau hasil & laporan keseluruhan (read-only, seperti supervisor) + bisa ikut melapor. | Read-only global + lapor |

> **Catatan login:** Setelah login, sistem mengarahkan ke dashboard sesuai role — Civitas → Dashboard Pelapor, PJ Ruang/Laboran → Dashboard Pengelola Area, Inventaris → Dashboard Inventaris, Pimpinan → Dashboard Supervisor. Tampilan & menu tiap role berbeda. Detail di [`UIUX_FLOW.md`](./UIUX_FLOW.md).
> 

### Stakeholder tidak langsung

- **Pihak Universitas** — menerima daftar barang manual dari Inventaris (berkala).

### 4.1 Autentikasi & Manajemen Akun (Final v1.2)

| Aspek | Keputusan |
| --- | --- |
| Identifier login | Email kampus UNS |
| Domain diterima | `@staff.uns.ac.id`, `@student.uns.ac.id`, `@uns.ac.id` |
| Sign Up | Publik, validasi domain + verifikasi email (link/OTP, valid 24 jam). Role default **PENGGUNA (Civitas)**. |
| Bootstrap Inventaris | **Setup Wizard** sekali saat database kosong membuat akun **Inventaris** pertama; halaman `/setup` diblokir setelahnya. |
| Akun PJ Ruang / Laboran / Inventaris / Pimpinan tambahan | Dibuat/di-promote Inventaris via FA-11 |
| Lupa password | Self-service 3 langkah: email → OTP 6 digit (10 menit) → password baru |
| Remember me | Cookie sesi 8 jam → 30 hari bila dicentang |
| Multi-device | Boleh login paralel (laptop + HP) |
| Force logout | Middleware cek `is_active` tiap request |
| Rate limit | 5 percobaan gagal → lock 5 menit |
| Captcha | Tidak digunakan |
| Email service | Mailtrap (dev) + Gmail SMTP (production) |
| Teknologi auth | JWT httpOnly cookie + bcrypt, redirect berbasis role |
| Status akun | `PENDING_VERIFICATION` / `ACTIVE` / `INACTIVE` |

**Alur singkat:**

- **Sign Up:** isi data → validasi domain UNS → kirim verifikasi email → akun `ACTIVE` (role PENGGUNA/Civitas) → login.
- **Login:** email + password → cek status akun → JWT → redirect ke dashboard sesuai role (Civitas, PJ Ruang/Laboran, Inventaris, Pimpinan).
- **Lupa Password:** email → OTP → password baru → notifikasi email.

---

## 5. Daftar Fitur

Fitur dikelompokkan per role dan diberi ID yang dipakai konsisten di SRS & Task Breakdown.

### 5.1 Fitur Pengguna/Pelapor (Civitas — berlaku untuk semua role saat melapor)

| ID | Fitur | Prioritas |
| --- | --- | --- |
| FU-01 | Login | MVP |
| FU-02 | Lihat barang di ruangannya | MVP |
| FU-03 | Cari barang (kode/nama/jenis/scan QR untuk info) | MVP |
| FU-04 | Lihat detail barang (lokasi terdaftar vs aktual, kondisi, status) | MVP |
| FU-05 | Ajukan pemindahan barang | MVP |
| FU-06 | Lapor kerusakan barang (deskripsi + foto) | MVP |
| FU-08 | Lihat status pengajuan (daftar gabungan + filter) & batalkan selama masih menunggu | MVP |
| FU-09 | Terima notifikasi in-app (lonceng + badge belum dibaca, klik ke detail, tandai semua dibaca) | MVP |
| FU-10 | Telusuri & lihat status barang seluruh ruangan (daftar global + filter; read-only) | MVP |

> **Catatan:** *Usulan penghapusan* bukan fitur Pengguna (Civitas). Sejak v1.2 hanya **PJ Ruang/Laboran** yang mengajukan penghapusan (**FA-27**) dan **Inventaris** yang memvalidasinya (**FA-07**). ID **FU-07 sengaja dikosongkan** agar penomoran FU-08…FU-10 tetap stabil.
> 

<aside>
📲

**Scan QR sebagai jalan pintas (FU-03 → FU-04):** Selain pencarian manual, pengguna dapat **scan atau upload QR** sebuah barang untuk langsung membuka **halaman detail barang** (FU-04). Dari halaman detail tersedia **tombol aksi cepat** sesuai hak role: **Lapor Kerusakan** (FU-06) serta **Ajukan Pemindahan** (FU-05). Ini **bukan fitur tersendiri**, melainkan jalan masuk cepat ke FU-03/FU-04 — berbeda dari **FA-12 Scan Cepat** yang khusus verifikasi fisik per ruangan oleh PJ Ruang/Laboran.

</aside>

### 5.2 Fitur Pengelola (PJ Ruang, Laboran, Inventaris, Pimpinan)

| ID | Fitur | Prioritas |
| --- | --- | --- |
| FA-01 | Login admin | MVP |
| FA-02 | Dashboard inventaris (ringkasan, pending, distribusi) | MVP |
| FA-03 | Kelola data barang (tambah/ubah/nonaktif/validasi) | MVP |
| FA-04 | Kelola master data (ruangan, jenis, gedung, unit) | MVP |
| FA-05 | Approval pemindahan (hanya kategori wajib approval) | MVP |
| FA-06 | Validasi laporan kerusakan & tetapkan tindak lanjut (pemeliharaan/perbaikan atau usulan hapus) | MVP |
| FA-07 | Validasi/approve usulan penghapusan (oleh Inventaris) | MVP |
| FA-08 | Lihat riwayat/timeline barang | MVP |
| FA-09 | Buat laporan inventaris (filter periode/lokasi/jenis/kondisi/status) | MVP |
| FA-10 | Export laporan (PDF/Excel) | Tahap 2 |
| FA-11 | Manajemen akun & role (ubah role, assign area PJ/Laboran, aktif/nonaktif, proteksi lockout) | MVP |
| FA-12 | **Scan Cepat verifikasi fisik** (matching real-time) | MVP |
| FA-13 | Filter barang penanganan khusus | MVP |
| FA-14 | Kelola sesi Stock Opname (mulai/jeda/lanjut/selesai) | MVP |
| FA-15 | Manajemen kategori approval (tentukan wajib/tidak) | MVP |
| FA-16 | Export daftar barang untuk universitas | MVP |
| FA-17 | Lihat histori tahunan penghapusan | MVP |
| FA-18 | Generate QR Code per barang (otomatis) | MVP |
| FA-19 | Cetak QR Label batch per ruangan (PDF A4) | MVP |
| FA-20 | Preview label sebelum cetak | Tahap 2 |
| FA-21 | Upload logo instansi (untuk label) | MVP |
| FA-22 | Atur ukuran & layout label | Tahap 2 |
| FA-23 | Lihat riwayat sesi verifikasi scan | Tahap 2 |
| FA-24 | Bandingkan sesi scan | Tahap 2 |
| FA-25 | Atur jadwal pemeliharaan preventif (default per jenis, override per unit) | MVP |
| FA-26 | Reminder jatuh tempo maintenance (dashboard + notifikasi) | MVP |
| FA-27 | Ajukan usulan penghapusan (oleh PJ Ruang/Laboran; barang rusak berat atau usang) | MVP |

### 5.3 Pemetaan prioritas (ringkas)

- **Tahap 1 (MVP):** login & 5 role (Civitas/PJ Ruang/Laboran/Inventaris/Pimpinan + sign up email UNS + setup wizard), data barang + master + sesi stock opname, pencarian & detail, lapor kerusakan, pengajuan pemindahan (kategori approval) & usulan hapus, tindak lanjut pemeliharaan oleh PJ, approval admin, **maintenance preventif terjadwal (FA-25/FA-26)**, status & kondisi barang transparan ke user (FU-10), **Scan Cepat online**, filter penanganan khusus, manajemen kategori approval, histori tahunan penghapusan, **generate QR + cetak QR label + upload logo**, laporan internal + export daftar, riwayat dasar.
- **Tahap 2:** dashboard statistik kaya, export PDF/Excel lengkap, notifikasi email, preview & atur layout label, riwayat & banding sesi scan, **offline mode scan**, filter laporan lanjutan.
- **Tahap 3:** analitik inventaris, print label massal lanjutan, integrasi sistem lain (jika perlu di masa depan).

### 5.4 Pemetaan Fitur → Role (Update v1.2)

Model kini terdesentralisasi. ID fitur (FU/FA) tetap sama; tabel ini menjelaskan **siapa pelaku**-nya.

| Role | Fitur yang Dijalankan |
| --- | --- |
| **Pengguna (Civitas)** | FU-01 … FU-10 (lapor kerusakan, ajukan pemindahan, pantau status pengajuan & telusur status barang). **Tidak ada ajukan pemeliharaan/penghapusan** — pemeliharaan adalah tindak lanjut PJ (FA-06), usulan penghapusan diajukan PJ (FA-27). Tidak mengelola data. |
| **PJ Ruang** | Semua FU + memproses & mengelola **ruang kelas** yang di-assign: FA-03, FA-05, FA-06, FA-08, FA-12, FA-13, FA-14, FA-18, FA-19, FA-20, FA-23, FA-24, **FA-27 (ajukan penghapusan)**, override FA-25, FA-26. |
| **Laboran** | Sama seperti PJ Ruang, untuk **laboratorium** yang di-assign. |
| **Inventaris** | FA-02, FA-04, **FA-07 (validasi penghapusan)**, FA-09, FA-10, FA-11, FA-15, FA-16, FA-17, FA-21, FA-22, FA-25 (default global), FA-26 (rekap). Punya **akses cadangan tercatat** ke fitur operasional area tanpa PJ aktif. |
| **Pimpinan Fakultas** | Lihat (read-only): FA-02, FA-08, FA-09, FA-17 + semua FU (saat melapor). |

---

## 6. Konsep Penting (Glosarium Produk)

| Istilah | Arti |
| --- | --- |
| **Pengguna (Civitas)** | Role default hasil sign up mandiri warga UNS. Bisa lapor & mengajukan, tidak punya area binaan. |
| **Scan Cepat** | Verifikasi fisik: pengelola pilih ruangan, scan QR barang satu per satu, sistem cocokkan real-time dengan daftar barang terdaftar di ruangan. Merupakan **alat** untuk menjalankan **Stock Opname**. |
| **Stock Opname** | Proses bisnis **terjadwal** (mis. per tahun anggaran, 1 Jan s/d 31 Des) untuk verifikasi fisik barang per ruangan — berbeda dari laporan kerusakan yang insidental. Scan Cepat dipakai sebagai alatnya. |
| **Penguasaan** | Unit/prodi yang memegang & bertanggung jawab atas barang (mis. Prodi Informatika), terpisah dari lokasi ruangan fisik. |
| **QR Code (entitas)** | QR sebagai entitas tersendiri ber-id sendiri & berisi data JSON ringkas; bisa diganti/cetak ulang tanpa mengubah data barang. Ada **2 tipe** (dibedakan field `t`): **QR Barang** (memuat `v`, `t`, `id_barang`, `kode_barang`, `id_ruangan`, `kode_ruangan`, `nama_barang`) dan **QR Ruangan** (memuat `v`, `t`, `id_ruangan`, `kode_ruangan`, `nama_ruangan`) untuk menetapkan lokasi aktual saat stock opname. |
| **Baseline Ruangan** | Daftar barang yang *seharusnya* ada di sebuah ruangan = barang yang **terdaftar** di ruangan itu saat sesi Stock Opname dimulai (bukan tabel/langkah fiksasi terpisah). |
| **Kategori Approval** | Klasifikasi barang yang menentukan apakah pemindahan butuh approval admin. Contoh: TV/komputer wajib; kursi/meja tidak. |
| **Flag Verifikasi** | Hasil verifikasi fisik terakhir per barang: Terverifikasi / Belum / Anomali. Di-reset ke Belum tiap awal tahun anggaran (mengikuti siklus Stock Opname). |
| **Histori Tahunan** | Akumulasi usulan penghapusan dikelompokkan per tahun (untuk diajukan akhir tahun). |
| **Plan A** | Import data awal dari Excel fakultas (kode existing). |
| **Plan B** | Input manual massal + auto-generate kode barang internal. |
| **Kode Barang** | Format `[JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT]`, contoh `MEJA-2025-R201-0128`. |
| **PJ Ruang** | Civitas yang di-promote Inventaris & di-assign satu/lebih ruang kelas; memproses laporan & mengelola barang di ruang tersebut. |
| **Laboran** | Seperti PJ Ruang, tetapi bertanggung jawab atas laboratorium yang di-assign. |
| **Inventaris** | Pengelola pusat: rekap data, laporan tahunan, histori hapus, export ke universitas, kelola master & akun. Punya akses cadangan tercatat bila area tanpa PJ aktif. |
| **Pimpinan Fakultas** | Supervisor: memantau hasil & laporan keseluruhan secara read-only; bisa ikut melapor. |
| **Fallback Tercatat** | Mekanisme Inventaris memproses area tanpa PJ aktif; setiap aksinya otomatis dicatat di timeline barang. |
| **Kondisi Barang** | Penilaian fisik: Baik / Rusak Ringan (bisa diperbaiki) / Rusak Berat (kandidat hapus). **Terpisah** dari Status Barang. Diperbarui dari **verifikasi laporan kerusakan**, **hasil stock opname**, atau **koreksi manual** Inventaris/pengelola. |
| **Status Barang** | Posisi dalam alur: Normal / Dilaporkan Rusak / Menunggu Validasi / Dalam Perawatan / Terjadwal Perawatan / Hilang / Diajukan Hapus / Nonaktif. |
| **Maintenance Preventif** | Servis berkala terjadwal (mis. AC tiap 3 bulan) tanpa menunggu barang rusak. |
| **Bootstrap Inventaris** | Pembuatan akun Inventaris pertama via Setup Wizard saat database masih kosong. |

---

## 7. Alur Utama (High-Level Flow)

Diagram detail per layar ada di [`UIUX_FLOW.md`](./UIUX_FLOW.md). Aturan transisi status & validasi ada di [`SRS.md`](./SRS.md).

### 7.1 Alur Pengajuan Pemindahan (Kategori Approval + Routing per Area)

1. **Semua role** (Civitas, PJ Ruang, Laboran, Inventaris, Pimpinan) dapat mengajukan. Pelapor pilih barang (dari daftar area / cari / scan) → isi lokasi tujuan + alasan.
2. Sistem cek kategori approval barang.
3. **Jika TIDAK wajib approval** → lokasi aktual langsung diupdate, riwayat dicatat, status **Langsung Tercatat**.
4. **Jika wajib approval** → pengajuan dirutekan ke **penanggung jawab area** (PJ Ruang untuk ruang kelas, Laboran untuk lab).
5. **Pemindahan dalam 1 area (PJ sama):** cukup **1 approval** dari PJ/Laboran area tersebut.
6. **Pemindahan ANTAR-area:** wajib **dual-approval paralel** — PJ **asal** (melepas) dan PJ **tujuan** (menerima) keduanya harus menyetujui, **tanpa urutan tertentu** (siapa pun boleh menyetujui lebih dulu). Barang berpindah hanya bila **keduanya** sudah setuju.
7. Bila area belum punya PJ aktif → **Inventaris memproses sebagai fallback (tercatat)**.
8. Jika disetujui → **lokasi barang langsung berpindah** (tanpa konfirmasi serah terima fisik) + riwayat tersimpan di timeline (FA-08).

### 7.2 Alur Pelaporan Kerusakan & Pemeliharaan

Maintenance terdiri dari **2 jalur**: reaktif (menunggu rusak) dan preventif (terjadwal). Setiap barang punya 2 atribut terpisah: **Kondisi** (fisik) & **Status** (alur).

**7.2.a Maintenance Reaktif**

1. Pelapor pilih barang → isi jenis kerusakan, deskripsi, urgensi, foto. Laporan dirutekan ke **PJ Ruang/Laboran area** terkait.
2. Status barang → "Dilaporkan Rusak" → "Menunggu Validasi".
3. PJ Ruang/Laboran area validasi (FA-06) → tetapkan **Kondisi** (Rusak Ringan = bisa diperbaiki / Rusak Berat = kandidat hapus) + tindakan.
4. Jika bisa diperbaiki → Status "Dalam Perawatan" → selesai → Status balik "Normal", Kondisi balik "Baik".
5. Jika tidak bisa diperbaiki (Rusak Berat) → PJ **ajukan usulan penghapusan** (FA-27) → divalidasi **Inventaris** (FA-07). Lihat §7.3.
6. Semua tercatat di timeline barang (FA-08).

**7.2.b Maintenance Preventif (Terjadwal) — MVP baru**

1. **Inventaris** menetapkan jadwal **default global per jenis** (FA-25) (mis. AC = 3 bulan, APAR = 6 bulan, Genset = 1 bulan); **PJ Ruang/Laboran** dapat **override per unit** di area-nya untuk kondisi khusus.
2. Sistem hitung tanggal servis berikutnya tiap unit.
3. Mendekati jatuh tempo → Status barang jadi "Terjadwal Perawatan" + reminder ke PJ Ruang/Laboran area (FA-26).
4. PJ/Laboran (atau Inventaris sebagai fallback) servis → catat → Status balik "Normal", tanggal servis berikutnya dihitung ulang.
5. Tercatat di timeline barang (FA-08); status terlihat oleh user/PJ (FU-10).

### 7.3 Alur Usulan Penghapusan (dengan Histori Tahunan)

1. **PJ Ruang/Laboran** mengajukan penghapusan (FA-27) untuk barang di area-nya — baik hasil triase laporan **Rusak Berat** maupun barang **usang/obsolete** (tidak harus ada laporan kerusakan dulu). Wajib **alasan + bukti** (foto/dokumen).
2. Pengajuan dirutekan ke **Inventaris** untuk **divalidasi** (FA-07): **Setujui** → status barang **Diajukan Hapus** (internal); **Tolak** → alasan wajib. Pengaju menerima **notifikasi** (FU-09).
3. Pengajuan yang disetujui dicatat ke **histori tahunan** (tahun berjalan).
4. **Inventaris** merekap akumulasi sepanjang tahun.
5. **Akhir tahun:** Inventaris export daftar → buat surat manual → serahkan ke universitas.

> **Catatan:** Civitas **tidak** mengajukan penghapusan; hanya PJ Ruang/Laboran. Persetujuan ada di tangan **Inventaris** (bukan PJ).
> 

### 7.4 Alur Scan Cepat Verifikasi Fisik (PJ Ruang / Laboran / Inventaris)

1. Pengelola pilih area (ruang/lab) yang ditanggungjawabi → sistem load daftar barang terdaftar (baseline) area.
2. Pengelola tap “Mulai Scan Cepat” → kamera ponsel/tablet aktif (input scan MVP via kamera mobile).
3. Scan QR barang satu per satu → matching real-time:
    - **Cocok (√ hijau)** — barang sesuai database ruangan.
    - **Tidak Cocok (⚠ kuning)** — barang terdaftar di ruangan lain.
    - **Tidak Terdaftar (✗ merah)** — QR tidak ada di database.
4. Selesai → ringkasan: terverifikasi, hilang (terdaftar di ruangan tapi tak discan), asing (discan tapi bukan milik ruangan ini).
5. Sesi **auto-save tiap scan** dan dapat **dijeda lalu dilanjutkan** (tidak harus sekali jalan) sampai ditandai selesai.
6. Setelah selesai, pengelola menindaklanjuti anomali **secara batch** (pilih beberapa item sekaligus).
7. Barang **hilang** (terdaftar tapi tak discan) langsung diberi status `HILANG` menunggu tindak lanjut; bila akhirnya dihapus, dibuat usulan penghapusan terpisah (sumber **Stock Opname**). Barang **asing milik ruangan lain** cukup **dicatat & ditandai** (lokasi tidak otomatis diubah).

### 7.5 Alur Input Awal / Launch (Plan A & Plan B)

- **Plan A:** import Excel → pilih ruangan → cetak QR label → potong & tempel → Stock Opname pertama (verifikasi baseline).
- **Plan B:** input barang per ruangan (auto-generate kode) → cetak label → tempel → Stock Opname pertama.

### 7.6 Alur Manajemen Akun & Role (FA-11)

**Aktor: Inventaris** (boleh lebih dari satu, sebagai cadangan). Inventaris pertama lahir dari Setup Wizard; Inventaris lain di-promote via fitur ini.

1. Inventaris buka menu **Manajemen Akun & Role** → lihat **daftar semua akun** dengan cari/filter (role, status, nama/email).
2. Pilih satu akun → aksi tersedia:
    - **Ubah role** (mis. PENGGUNA → PJ Ruang/Laboran/Inventaris/Pimpinan, atau sebaliknya). Aturan **1 akun = 1 role** (tidak rangkap).
    - **Kelola assignment area** (khusus PJ Ruang & Laboran): tambah/lepas ruang kelas (PJ Ruang) atau laboratorium (Laboran) — many-to-many.
    - **Aktif / Nonaktifkan akun** → set `status = INACTIVE` memicu **force logout** (middleware cek `is_active`).
    - **Kirim ulang verifikasi email / bantu reset** (opsional).
3. **Reassignment area saat demote/nonaktif (MANUAL):** bila PJ Ruang/Laboran yang masih memegang area di-demote atau dinonaktifkan, sistem **memberi peringatan** bahwa area akan kosong dan **Inventaris menunjuk pengganti/penanganan secara manual** (tidak otomatis dilempar ke fallback).
4. **Proteksi lockout:** sistem **menolak** penghapusan, penonaktifan, atau demote terhadap **Inventaris terakhir yang aktif** (pesan: *"Tunjuk Inventaris lain dulu"*), agar selalu ada minimal satu Inventaris.
5. Simpan → seluruh perubahan **dicatat di log aktivitas** (audit).

### 7.7 Alur Pelaporan Kerusakan Barang (FU-06)

**Aktor: semua role** (Civitas, PJ Ruang, Laboran, Inventaris, Pimpinan) — semua dapat melapor.

1. Pelapor membuka menu **Lapor**, pilih salah satu jalur input:
    - **Jalur cepat (QR):** scan QR via kamera HP atau **upload gambar QR** → data barang (kode, nama, jenis, ruangan) **otomatis terisi**.
    - **Jalur manual:** cari barang lewat kode/nama lalu pilih.
2. Isi **deskripsi kerusakan** (wajib) dan **foto** (opsional) → kirim. Laporan tersimpan status `BARU`, `status_barang` → **Dilaporkan Rusak**.
3. **Routing otomatis** berdasar lokasi barang: ruang kelas → **PJ Ruang** area; laboratorium → **Laboran** area; area tanpa pengelola aktif → **Inventaris** sebagai fallback (tercatat di audit).
4. **Boleh lebih dari satu laporan aktif** per barang (kerusakan tambahan saat laporan lain masih diproses).
5. Pengelola memproses: **Proses** (status `DIPROSES`) lalu lanjut alur maintenance reaktif (7.2.a); **Tolak** (status `DITOLAK`, **alasan penolakan wajib diisi**); atau **Selesai** (status `SELESAI` dengan menetapkan Kondisi akhir barang).
6. Setiap perubahan status memicu **notifikasi in-app real-time** ke pelapor (MVP: in-app; email menyusul). Alasan penolakan ikut ditampilkan bila ditolak.
7. **Pimpinan** memantau seluruh laporan (read-only); **Inventaris** merekap untuk histori dan laporan tahunan. Semua aksi tercatat di timeline barang (FA-08).

### 7.8 Alur Pantau Status Pengajuan (FU-08)

**Aktor: semua role** (untuk pengajuan/laporan miliknya sendiri).

1. User buka menu **Pengajuan Saya** → **satu daftar gabungan** berisi semua pemindahan & laporan kerusakan yang ia ajukan, tiap baris dengan **badge status** berwarna + tanggal.
2. Tersedia **filter** berdasarkan **jenis** (pemindahan / laporan kerusakan) dan **status**.
3. Klik item → **detail**: timeline progres, status terkini, dan **catatan/alasan admin** bila ditolak/revisi. Pemindahan antar-area cukup ditampilkan **status ringkas** (mis. *Menunggu persetujuan*), tanpa rincian sisi asal/tujuan.
4. User dapat **membatalkan** pengajuan/laporan miliknya **selama masih menunggu** (pemindahan `MENUNGGU`, laporan `BARU`) → status menjadi **Dibatalkan**; setelah diproses tidak bisa dibatalkan.
5. Setiap perubahan status muncul **real-time** dan memicu notifikasi (FU-09).

### 7.9 Alur Notifikasi In-App (FU-09)

**Aktor: semua role** (notifikasi ditujukan ke penerima yang relevan).

1. Sistem membuat notifikasi tiap ada kejadian relevan. Untuk **Pengguna (Civitas)**: perubahan status pengajuan pemindahan (disetujui/ditolak/selesai/dibatalkan) dan permintaan **revisi**; status laporan kerusakan miliknya tetap dinotifikasi (lihat §7.7). Untuk **PJ Ruang/Laboran**: ada pengajuan/laporan baru di area + reminder maintenance jatuh tempo (FA-26). Untuk **Inventaris**: usulan penghapusan baru / pengajuan butuh validasi (FA-07).
2. Notifikasi tampil lewat **ikon lonceng** di header dengan **badge jumlah belum dibaca**.
3. Klik lonceng → daftar notifikasi (terbaru di atas): judul, ringkasan, waktu, dan penanda dibaca/belum.
4. Klik satu notifikasi → diarahkan ke **detail terkait** (pengajuan/laporan/barang) dan otomatis ditandai **sudah dibaca**.
5. Tersedia aksi **Tandai semua sudah dibaca**.
6. MVP **in-app saja** (real-time); email menyusul (Tahap 2).

### 7.10 Alur Lihat & Telusur Status Barang (FU-10)

**Aktor: Pengguna (Civitas)** — read-only seluruh ruangan fakultas.

1. Pengguna membuka menu **Barang** → tampil **daftar global** seluruh barang fakultas (read-only).
2. Tersedia **pencarian** (kode/nama) dan **filter**: ruangan, status barang, serta jenis barang.
3. Pilih satu barang → **detail barang**: lokasi & info dasar (kode, nama, jenis, ruangan) serta **kondisi** (Baik/Rusak Ringan/Rusak Berat) dan **status barang** (Normal/Dilaporkan Rusak/Dalam Perawatan/Terjadwal Perawatan/Hilang, dll).
4. **Jadwal maintenance preventif tidak ditampilkan** ke Pengguna; detail jadwal hanya untuk PJ Ruang/Laboran/Inventaris. Pengguna tetap melihat *status* Terjadwal Perawatan sebagai bagian dari status barang.
5. Dari detail, Pengguna dapat memakai aksi cepat **Lapor Kerusakan** (FU-06) atau **Ajukan Pemindahan** (FU-05) sesuai hak.

---

## 8. Asumsi & Keputusan Teknis (ringkas)

| Aspek | Keputusan |
| --- | --- |
| Frontend & Backend | Next.js (App Router) fullstack, TypeScript |
| Database | MySQL 8 + Prisma ORM |
| Autentikasi | JWT (httpOnly cookie) + bcrypt, redirect berbasis role |
| UI | Tailwind CSS + shadcn/ui, Bahasa Indonesia |
| Penyimpanan foto | Disk lokal (lewat lapisan `storage`, siap pindah ke cloud) |
| QR | Generate `qrcode`, scan `html5-qrcode`, label = print HTML→PDF |
| Deployment awal | Lokal dulu, belum ke server kampus |

Detail arsitektur ada di [`SDD.md`](./SDD.md).

---

## 9. Risiko Produk (ringkas)

| Risiko | Mitigasi |
| --- | --- |
| Data awal tidak ada | Sediakan Plan B (input manual + auto-generate kode) |
| Anomali massal saat scan | Batch perbaiki lokasi + batasi jumlah barang per sesi |
| Kamera HP tidak kompatibel | Sediakan input manual kode / USB scanner |
| Koneksi putus saat scan | Tahap 2: offline-first (cache + sinkron) |
| Inventaris bingung alur lapor universitas | SOP dalam sistem + tooltip + template Excel |
| Kode barang duplikat | Validasi unik saat input & import |

Daftar lengkap risiko teknis ada di SRS/SDD.