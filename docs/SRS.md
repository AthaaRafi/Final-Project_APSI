# SRS

# SRS — Software Requirements Specification

> **Status:** Update v1.2 (sinkron model 5 role, FA-11, kondisi/status barang & maintenance preventif) · **Tanggal:** 9 Juni 2026
**Konteks teknis:** Next.js (App Router) fullstack · MySQL · Prisma · JWT cookie.
**Dokumen terkait:** [`PRD.md`](./PRD.md) · [`SDD.md`](./SDD.md) · [`RULES.md`](./RULES.md)
> 

SRS ini mendetailkan **perilaku, validasi, dan aturan bisnis** yang harus dipenuhi sistem. PRD = *apa*; SRS = *bagaimana sistem harus berperilaku & aturan apa yang ditegakkan*. Implementasi teknis (skema, endpoint) ada di SDD.

> **Prinsip penegakan:** Semua validasi & aturan bisnis di bawah ini **wajib ditegakkan di backend** (Route Handler → Service). Validasi di frontend hanya untuk UX, bukan satu-satunya pertahanan.
> 

---

## 1. Daftar Istilah Status

### 1.1 Kondisi Barang (`kondisi`)

> **Catatan:** `kondisi` (keadaan fisik) dan `status_barang` (siklus administratif) **dipisah**. Satu barang punya keduanya sekaligus.
> 

| Kondisi | Makna |
| --- | --- |
| `BAIK` | Fisik baik, berfungsi normal. |
| `RUSAK_RINGAN` | Ada kerusakan minor, masih bisa dipakai / layak diperbaiki. |
| `RUSAK_BERAT` | Rusak parah, tidak layak pakai / kandidat penghapusan. |

### 1.2 Status Barang (`status_barang`)

| Status | Makna |
| --- | --- |
| `NORMAL` | Barang aktif & digunakan, tidak ada proses berjalan. |
| `DILAPORKAN_RUSAK` | Ada laporan kerusakan, menunggu ditinjau pengelola area. |
| `MENUNGGU_VALIDASI` | Laporan/pengajuan sedang divalidasi pengelola area. |
| `DALAM_PERAWATAN` | Sedang diperbaiki/diperiksa (perawatan korektif). |
| `TERJADWAL_PERAWATAN` | Masuk jadwal perawatan preventif berkala (mis. AC, APAR, genset). |
| `HILANG` | Barang tidak ditemukan (mis. hasil stock opname) — menunggu tindak lanjut. |
| `DIAJUKAN_HAPUS` | Dalam proses usulan penghapusan internal. |
| `NONAKTIF` | Dinonaktifkan pengelola (soft, tidak dihapus). |

> Pemindahan **tidak** mengubah `status_barang`; perpindahan tercermin pada `lokasi_aktual`.
> 

### 1.3 Flag Verifikasi (`flag_verifikasi`) — hasil scan terakhir

| Flag | Makna |
| --- | --- |
| `BELUM` | Belum diverifikasi pada tahun anggaran berjalan (di-reset tiap awal tahun anggaran). |
| `TERVERIFIKASI` | Discan & cocok dengan daftar barang terdaftar di ruangan. |
| `ANOMALI` | Discan tapi tidak cocok (salah ruangan) atau terdeteksi hilang. |

> **Reset tahunan:** `flag_verifikasi` semua barang di-reset ke `BELUM` tiap awal tahun anggaran (mengikuti siklus Stock Opname), sehingga status verifikasi dihitung per tahun.
> 

### 1.4 Status Pengajuan (`status_pengajuan`)

| Status | Makna |
| --- | --- |
| `MENUNGGU` | Dikirim user, menunggu keputusan admin. |
| `DISETUJUI` | Diterima admin. |
| `DITOLAK` | Ditolak admin (dengan catatan). |
| `REVISI` | Perlu diperbaiki user. |
| `SELESAI` | Tindak lanjut selesai. |
| `LANGSUNG_TERCATAT` | Pemindahan kategori tidak wajib approval, otomatis tercatat. |
| `DIBATALKAN` | Dibatalkan oleh pengaju selagi masih `MENUNGGU` (belum diproses admin). |

### 1.5 Status Sesi Verifikasi (`status_sesi`)

`AKTIF` (scan berjalan) · `SELESAI` (disimpan) · `BATAL`.

### 1.6 Status Matching Scan (`status_matching`)

`COCOK` · `TIDAK_COCOK` (terdaftar di ruangan lain) · `TIDAK_TERDAFTAR` (QR tak dikenal).
Status turunan saat ringkasan sesi: `HILANG` (terdaftar di ruangan tapi tidak discan), `ASING` (= TIDAK_TERDAFTAR atau TIDAK_COCOK milik ruangan lain yang muncul di ruangan ini).

---

## 2. Aturan Autentikasi & Otorisasi

> **Update v1.1:** Login berbasis **email kampus UNS** (bukan username) dengan **5 role**: `PENGGUNA` (Civitas), `PJ_RUANG`, `LABORAN`, `INVENTARIS`, `PIMPINAN`. Model otorisasi terdesentralisasi per area.
> 

| ID | Aturan |
| --- | --- |
| AUTH-01 | Login pakai **email kampus UNS** dan `password`. Password disimpan **hashed (bcrypt)**, tidak pernah plaintext. |
| AUTH-02 | Domain email yang diterima: `@staff.uns.ac.id`, `@student.uns.ac.id`, `@uns.ac.id`. Domain lain ditolak saat sign up & login. |
| AUTH-03 | **Sign Up publik:** validasi domain UNS → kirim **verifikasi email** (link/OTP, valid 24 jam) → akun `ACTIVE` dengan role default `PENGGUNA`. |
| AUTH-04 | **Bootstrap Inventaris:** saat database kosong, **Setup Wizard** (`/setup`) membuat akun `INVENTARIS` pertama; `/setup` diblokir setelah ada Inventaris. |
| AUTH-05 | Setelah login sukses, sistem set **JWT di cookie httpOnly** (tidak bisa dibaca JS). |
| AUTH-06 | **Redirect berbasis role:** `PENGGUNA` → Dashboard Pelapor, `PJ_RUANG`/`LABORAN` → Dashboard Pengelola Area, `INVENTARIS` → Dashboard Inventaris, `PIMPINAN` → Dashboard Supervisor. |
| AUTH-07 | **RBAC:** setiap endpoint & menu mengecek role. Role yang lebih rendah tidak boleh mengakses fungsi role lain meski tahu URL-nya. |
| AUTH-08 | **Scope per area:** `PJ_RUANG` hanya memproses/mengelola **ruang kelas** yang di-assign; `LABORAN` hanya **laboratorium** yang di-assign (lihat tabel `user_ruangan`). |
| AUTH-09 | `PENGGUNA` & `PIMPINAN` bisa **melapor & mengajukan** untuk barang di seluruh sistem, tetapi **tidak mengelola** data barang. |
| AUTH-10 | `INVENTARIS` melihat seluruh data agregat fakultas + punya **akses cadangan tercatat** untuk memproses area tanpa PJ aktif. `PIMPINAN` bersifat **read-only** global. |
| AUTH-11 | **Lupa password** self-service 3 langkah: email → OTP 6 digit (valid 10 menit) → password baru. |
| AUTH-12 | **Remember me:** cookie sesi 8 jam, diperpanjang jadi 30 hari bila dicentang. **Multi-device** diizinkan (login paralel laptop + HP). |
| AUTH-13 | **Force logout:** middleware memeriksa `status`/`is_active` tiap request; akun `INACTIVE` langsung diputus sesinya. |
| AUTH-14 | **Rate limit:** 5 percobaan login gagal → kunci 5 menit. Tanpa captcha. |
| AUTH-15 | Percobaan login gagal menampilkan pesan generik (“Email atau password salah”) — tidak membocorkan field mana yang salah. |
| AUTH-16 | Logout menghapus cookie sesi. Status akun: `PENDING_VERIFICATION` / `ACTIVE` / `INACTIVE`. |

### 2.1 Aturan Manajemen Akun & Role (FA-11)

- **ACC-01** — Hanya `INVENTARIS` yang boleh mengubah role, mengelola assignment area, serta mengaktifkan/menonaktifkan akun.
- **ACC-02** — **1 akun = 1 role** (tidak rangkap). Mengubah role ke/dari `PJ_RUANG`/`LABORAN` menyesuaikan data assignment area.
- **ACC-03** — Assignment area `PJ_RUANG` (ruang kelas) & `LABORAN` (laboratorium) bersifat **many-to-many** via `user_ruangan`.
- **ACC-04** — **Reassignment manual:** bila PJ/Laboran yang masih memegang area di-demote/dinonaktifkan, sistem **memberi peringatan** area akan kosong dan Inventaris menunjuk pengganti **secara manual** (tidak ada fallback otomatis).
- **ACC-05** — **Proteksi lockout:** sistem **menolak** penghapusan, penonaktifan, atau demote terhadap **Inventaris aktif terakhir** (pesan: “Tunjuk Inventaris lain dulu”).
- **ACC-06** — Setiap aksi manajemen akun & role **dicatat di log aktivitas** (audit): aktor, target, perubahan, waktu.
- **ACC-07** — Nonaktif akun = **soft** (set `status = INACTIVE`), bukan hapus baris; akun bisa diaktifkan kembali.

### 2.2 Aturan Pelaporan Kerusakan (FU-06)

- **LAP-01** — Semua role (`PENGGUNA`, `PJ_RUANG`, `LABORAN`, `INVENTARIS`, `PIMPINAN`) boleh membuat laporan kerusakan barang.
- **LAP-02** — Input laporan punya **2 jalur**: (a) **scan/upload QR** untuk mengisi data barang otomatis, (b) **manual** cari kode/nama barang. `deskripsi` wajib; `foto` opsional.
- **LAP-03** — **Routing otomatis** berbasis lokasi: barang di ruang `KELAS` → PJ Ruang area; di `LABORATORIUM` → Laboran area; area tanpa pengelola aktif → `INVENTARIS` (fallback tercatat di `activity_log`).
- **LAP-04** — Satu barang **boleh punya lebih dari satu laporan aktif** sekaligus (kerusakan tambahan saat laporan lain masih diproses).
- **LAP-05** — Status laporan: `BARU`, `MENUNGGU_VERIFIKASI`, `TERVERIFIKASI`, `DIPROSES`, `SELESAI`, `DITOLAK`. Saat **menolak, alasan penolakan wajib diisi**.
- **LAP-06** — Saat laporan dibuat, `status_barang` → `DILAPORKAN_RUSAK`; tindak lanjut mengikuti alur maintenance reaktif (validasi FA-06).
- **LAP-07** — Setiap perubahan status laporan memicu **notifikasi in-app real-time** ke pelapor (MVP: in-app; email menyusul); alasan penolakan ditampilkan bila `DITOLAK`.
- **LAP-08** — **Tidak ada pengajuan "pemeliharaan" oleh user.** Pemeliharaan/perbaikan adalah **keputusan PJ** saat memvalidasi laporan (FA-06): `RUSAK_RINGAN` → tindak lanjut **perawatan/perbaikan** (`DALAM_PERAWATAN`); `RUSAK_BERAT` → PJ **ajukan usulan penghapusan** (FA-27), **divalidasi Inventaris** (FA-07).
- **LAP-09** — **Verifikasi laporan wajib:** sebelum diproses, laporan melewati tahap verifikasi PJ Ruang/Laboran (`MENUNGGU_VERIFIKASI` → `TERVERIFIKASI`); sistem mencatat **siapa** yang memverifikasi (`diverifikasi_oleh`) dan **kapan** (`verified_at`).

---

## 3. Aturan Data Barang & Kode

| ID | Aturan |
| --- | --- |
| BRG-01 | Format kode barang: `[JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT]`, contoh `MEJA-2025-R201-0128`. |
| BRG-02 | `NOMOR_URUT` 4 digit dengan leading zero (`0001`). |
| BRG-03 | **Kode barang wajib unik.** Sistem **menolak** input/import dengan kode duplikat (uji `KP-03`). |
| BRG-04 | **Plan A:** import dari Excel fakultas memakai kode yang sudah ada (tetap divalidasi unik). |
| BRG-05 | **Plan B:** jika kode tidak tersedia, sistem **auto-generate** nomor urut per ruangan per tahun (uji `KP-15`). |
| BRG-06 | Setiap barang punya `lokasi_terdaftar` dan `lokasi_aktual` (keduanya merujuk ruangan valid di master). |
| BRG-07 | Setiap barang punya `id_kategori_approval` (menentukan butuh approval saat pindah atau tidak). |
| BRG-08 | Setiap barang otomatis punya **QR Code digital** saat dibuat/diimport (uji `KP-20`). |
| BRG-09 | Field wajib saat input barang: kode (atau auto-generate), nama, jenis, tahun, lokasi terdaftar, kondisi, kategori approval, foto. |
| BRG-10 | Penonaktifan barang = **soft delete** (set `NONAKTIF` / `deleted_at`), bukan hapus baris. |
| BRG-11 | `kondisi` ∈ {`BAIK`, `RUSAK_RINGAN`, `RUSAK_BERAT`}; `status_barang` mengikuti daftar di §1.2. |
| BRG-12 | Setiap barang punya atribut **`penguasaan`** (unit/prodi penguasa, mis. `Prodi Informatika`) — pihak yang memegang & bertanggung jawab, terpisah dari lokasi fisik ruangan. |
| BRG-13 | **QR Code = entitas terpisah** (`qr_code`) ber-`id` sendiri & berelasi ke barang/ruangan; satu barang boleh punya beberapa QR (riwayat) dengan satu **aktif**, agar QR bisa diganti/cetak ulang tanpa mengubah data barang. **Payload QR Barang (field final):** JSON ringkas berisi `v` (versi skema, =1), `t` (`"barang"`), `id_barang`, `kode_barang`, `id_ruangan`, `kode_ruangan`, `nama_barang`. Disimpan tipe **TEXT terkecil** (`TinyText`, maks 3KB), bukan varchar. |
| BRG-14 | **`kondisi` dan `status_barang` adalah dua kolom terpisah** pada barang (lihat §1.1 & §1.2). **Sumber pembaruan `kondisi`:** (a) otomatis saat **verifikasi laporan kerusakan** — PJ/Laboran menetapkan `RUSAK_RINGAN`/`RUSAK_BERAT` (LAP-08/09); (b) **hasil stock opname** — kondisi aktual yang dicatat petugas dapat memperbarui `kondisi` barang; (c) **override manual** oleh Inventaris/pengelola untuk koreksi. `kondisi` menjadi **satu-satunya sumber kebenaran** di tabel barang; tiap perubahan mencatat aktor & waktu (audit). Pembaruan `kondisi` dari opname **tidak** otomatis memicu perawatan (lihat MTC-09). |
| BRG-15 | **QR Ruangan (varian terpisah).** Selain QR Barang, sistem menyediakan **QR Ruangan** (`tipe = RUANGAN` pada entitas `qr_code`, berelasi ke `ruangan`) untuk **menetapkan lokasi aktual** saat stock opname. **Payload QR Ruangan (field final):** `v` (=1), `t` (`"ruangan"`), `id_ruangan`, `kode_ruangan`, `nama_ruangan`; tipe **TEXT terkecil** (maks 3KB), bukan varchar. Field `t` menjadi pembeda saat scan: `barang` → buka detail/verifikasi barang; `ruangan` → set lokasi aktual sesi opname. |

### 3.1 Validasi field barang

| Field | Aturan validasi |
| --- | --- |
| kode_barang | Wajib unik; sesuai format; uppercase; tanpa spasi. |
| nama_barang | Wajib; 1–100 karakter. |
| jenis_barang | Wajib; harus ada di master jenis. |
| tahun_pembelian | Wajib; 4 digit; ≤ tahun berjalan. |
| nomor_urut_perolehan | Wajib; integer ≥ 1; ditampilkan 4 digit. |
| lokasi_terdaftar / lokasi_aktual | Wajib; harus ruangan valid. |
| kondisi | Wajib; salah satu enum kondisi. |
| foto | Wajib; format JPG/PNG/WebP; **maks 2 MB** (auto-kompres bila > batas). |

---

## 4. Aturan Kategori Approval

| ID | Aturan |
| --- | --- |
| KAT-01 | Admin menentukan kategori barang `wajib_approval` = true/false (uji `KP-14`). |
| KAT-02 | Saat user mengajukan pemindahan, sistem **cek kategori** barang. |
| KAT-03 | Jika `wajib_approval = false` → pemindahan **langsung tercatat** (`LANGSUNG_TERCATAT`), `lokasi_aktual` diupdate, riwayat dicatat. `status_barang` tetap (`NORMAL`) — pemindahan tercermin di lokasi, bukan status. |
| KAT-04 | Jika `wajib_approval = true` → buat pengajuan `MENUNGGU`, lokasi **belum** berubah sampai admin approve. |
| KAT-05 | Form pemindahan menampilkan indikator: “Wajib Approval” atau “Langsung Tercatat” sebelum submit. |
| KAT-06 | Contoh default: Tidak wajib = kursi, meja, rak kecil, papan tulis. Wajib = TV, komputer, proyektor, printer, lemari arsip, elektronik. (Bisa dikonfigurasi admin.) |

---

## 5. Aturan Pengajuan (Umum)

| ID | Aturan |
| --- | --- |
| PNG-01 | Jenis pengajuan ∈ {`PEMINDAHAN`, `PEMELIHARAAN`, `KERUSAKAN`, `PENGHAPUSAN`}. |
| PNG-02 | Satu barang **tidak boleh** punya 2 pengajuan aktif yang bertentangan (mis. dua pemindahan `MENUNGGU` sekaligus). Sistem menolak pengajuan baru jika ada konflik. |
| PNG-03 | Pengajuan menyimpan: pengaju, tanggal, alasan, lampiran, status, catatan admin. |
| PNG-04 | Perubahan status pengajuan **selalu** mencatat riwayat + memicu notifikasi ke pengaju (uji FU-09). |
| PNG-05 | User hanya bisa melihat/mengedit pengajuan **miliknya**. |
| PNG-06 | Admin bisa approve/reject/minta revisi; reject & revisi **wajib** mengisi catatan alasan. |
| PNG-07 | **Pantau status (FU-08):** pengaju melihat **satu daftar gabungan** seluruh pengajuan & laporan miliknya (pemindahan + kerusakan) dengan **filter jenis & status** dan badge status berwarna; detail menampilkan timeline + catatan/alasan admin. Pemindahan antar-area ditampilkan **status ringkas** (tanpa rincian sisi asal/tujuan). |
| PNG-08 | **Batalkan pengajuan:** pengaju boleh membatalkan miliknya **selama belum diproses** — pemindahan berstatus `MENUNGGU`, laporan kerusakan berstatus `BARU` → status menjadi `DIBATALKAN`. Setelah diproses (`DISETUJUI`/`DIPROSES`/`DITOLAK`) tidak dapat dibatalkan. Pembatalan dicatat di timeline & memicu notifikasi. |

### 5.1 State machine status pengajuan

```
MENUNGGU ──approve──> DISETUJUI ──tindak lanjut selesai──> SELESAI
MENUNGGU ──reject───> DITOLAK
MENUNGGU ──minta revisi──> REVISI ──user kirim ulang──> MENUNGGU
MENUNGGU ──user batalkan──> DIBATALKAN (final)
(Pemindahan kategori tidak wajib approval) ──> LANGSUNG_TERCATAT (final)
```

Transisi di luar diagram **ditolak** backend.

---

## 6. Aturan Pemindahan Barang

| ID | Aturan |
| --- | --- |
| PMD-01 | Lokasi asal diisi otomatis dari `lokasi_aktual`/`lokasi_terdaftar` barang. |
| PMD-02 | Lokasi tujuan wajib dipilih dari master ruangan & **berbeda** dari lokasi asal. |
| PMD-03 | Alasan pemindahan wajib (min 5 karakter). |
| PMD-04 | Jika disetujui/langsung tercatat → `lokasi_aktual` diupdate, riwayat dicatat dengan aktor & waktu; `status_barang` tidak berubah karena pemindahan (uji `KP-05`). |
| PMD-05 | Pemindahan **tidak** otomatis mengubah `lokasi_terdaftar` kecuali admin memilih “samakan lokasi terdaftar”. |
| PMD-06 | **Routing per area:** pengajuan wajib approval dirutekan ke penanggung jawab lokasi — `PJ_RUANG` untuk ruang kelas, `LABORAN` untuk laboratorium. |
| PMD-07 | **Pemindahan dalam 1 area** (PJ sama) cukup **1 approval**. **Pemindahan antar-area** wajib **dual-approval paralel**: PJ asal (melepas) & PJ tujuan (menerima) keduanya menyetujui **tanpa urutan tertentu**; barang pindah hanya saat **kedua** persetujuan masuk. Bila area tanpa PJ aktif, `INVENTARIS` memproses sebagai **fallback tercatat**. |
| PMD-08 | **Siapa yang boleh mengajukan:** semua role (`PENGGUNA`, `PJ_RUANG`, `LABORAN`, `INVENTARIS`, `PIMPINAN`) dapat mengajukan pemindahan barang. |
| PMD-09 | Saat persetujuan lengkap (atau langsung tercatat), `lokasi_aktual` **langsung diperbarui tanpa konfirmasi serah terima fisik**; perubahan dicatat di riwayat & memicu notifikasi ke pengaju (FU-09). |

### 6.1 State machine pemindahan antar-area (dual-approval paralel)

```
DIAJUKAN ──approve salah satu sisi──> DISETUJUI_ASAL / DISETUJUI_TUJUAN (parsial; urutan bebas)
DISETUJUI_ASAL / DISETUJUI_TUJUAN ──sisi lain approve──> DISETUJUI ──lokasi langsung pindah──> SELESAI
DIAJUKAN / parsial ──salah satu menolak──> DITOLAK (pemindahan batal)
```

Pemindahan **dalam 1 area** memakai alur 1 approval standar (§5.1).

---

## 7. Aturan Kerusakan & Pemeliharaan

| ID | Aturan |
| --- | --- |
| MTC-01 | Laporan kerusakan wajib: jenis kerusakan, tingkat (`RINGAN`/`SEDANG`/`BERAT`), deskripsi, urgensi (`RENDAH`/`SEDANG`/`TINGGI`), **foto** (uji `KP-06`). |
| MTC-02 | Setelah lapor, status barang → `DILAPORKAN_RUSAK`; setelah ditinjau pengelola → `MENUNGGU_VALIDASI` lalu `DALAM_PERAWATAN` sesuai tindak lanjut. |
| MTC-03 | Admin menetapkan tindak lanjut: pemeliharaan, penggantian, atau usulan penghapusan. |
| MTC-04 | Semua tindakan tercatat di timeline barang. |
| MTC-05 | **Maintenance preventif berkala** per jenis barang: jadwal default global ditetapkan `INVENTARIS` (mis. AC tiap 3 bln, APAR 6 bln, Genset 1 bln) — FA-25. |
| MTC-06 | `PJ_RUANG`/`LABORAN` dapat **override jadwal per unit** barang di area-nya bila kebutuhan berbeda dari default jenis (FA-25). |
| MTC-07 | Saat jatuh tempo, barang ditandai `TERJADWAL_PERAWATAN` dan **reminder** dikirim ke pengelola area (FA-26). `PENGGUNA` dapat melihat status barang tsb. |
| MTC-08 | **Pemeliharaan/perbaikan dari laporan kerusakan dicatat jenis `KOREKTIF`**; maintenance preventif terjadwal dicatat `PREVENTIF`. Civitas **tidak** mengajukan pemeliharaan — itu keputusan PJ (FA-06). |
| MTC-09 | **Sumber perawatan** hanya dari **laporan kerusakan** (korektif) & **jadwal preventif**. Temuan **stock opname** boleh **memperbarui `kondisi`** barang (koreksi berkala) tetapi *tidak* otomatis memicu perawatan; bila perlu perbaikan, dibuat laporan/tindak lanjut terpisah. |

---

## 8. Aturan Usulan Penghapusan & Histori Tahunan

| ID | Aturan |
| --- | --- |
| HPS-01 | Usulan penghapusan wajib: alasan + bukti (foto/dokumen). |
| HPS-02 | **Inventaris** memvalidasi (setujui/tolak) → bila disetujui, status barang → `DIAJUKAN_HAPUS` (internal); penolakan wajib menyertakan alasan. |
| HPS-03 | Pengajuan masuk **histori tahunan** sesuai tahun berjalan (grouping per tahun). |
| HPS-04 | Admin bisa melihat akumulasi usulan sepanjang tahun kapan saja (uji `KP-17`). |
| HPS-05 | Sistem menampilkan info kebijakan: “Penghapusan diajukan setahun sekali (kebijakan universitas).” |
| HPS-06 | Admin bisa **export daftar** barang `DIAJUKAN_HAPUS` ke Excel/PDF untuk diserahkan manual (uji `KP-18`). |
| HPS-07 | **Sistem TIDAK mengirim data otomatis** ke universitas — hanya export manual (uji `KP-19`). |
| HPS-08 | Status pasca-serah dilacak manual oleh admin (sistem hanya menyimpan riwayat). |
| HPS-09 | **Hanya `PJ_RUANG`/`LABORAN`** (pengelola area) yang boleh **mengajukan** penghapusan (FA-27); `PENGGUNA`/Civitas **tidak**. Pemicu bebas: barang **Rusak Berat** (hasil triase laporan) **maupun** barang **usang/obsolete** tanpa laporan kerusakan. **Persetujuan oleh `INVENTARIS`** (FA-07). |
| HPS-10 | **Sumber usulan penghapusan wajib dicatat** (`sumber` ∈ {`LAPORAN_KERUSAKAN`, `STOCK_OPNAME`, `MANUAL`}) beserta referensi opsional ke sumbernya, agar jelas barang diusulkan hapus karena laporan kerusakan, temuan stock opname, atau keputusan manual. |

---

## 9. Aturan Baseline Ruangan (Stock Opname)

> **Catatan:** Konsep "fiksasi" sebagai langkah/tabel terpisah **dihapus**; baseline kini diambil langsung dari data barang terdaftar di ruangan (tanpa penguncian snapshot manual).
> 

| ID | Aturan |
| --- | --- |
| BAS-01 | **Baseline ruangan** = daftar barang yang `lokasi_terdaftar`-nya ruangan tersebut; diambil otomatis saat sesi Stock Opname dimulai (bukan snapshot/tabel terpisah). |
| BAS-02 | Matching scan selalu dibandingkan terhadap **baseline** ruangan terkait (barang terdaftar di ruangan itu). |
| BAS-03 | Penyesuaian baseline dilakukan dengan mengubah `lokasi_terdaftar` barang saat menangani anomali, bukan mengunci snapshot. |

---

## 10. Aturan Scan Cepat & Matching

> **Catatan ruang lingkup:** §10 hanya berlaku untuk **Scan Cepat verifikasi fisik per ruangan (FA-12)** oleh `PJ_RUANG`/`LABORAN`. **Scan QR untuk melihat info barang** termasuk fitur pencarian umum (FU-03) yang membuka **detail barang (FU-04)**; dari detail tersebut tersedia tombol cepat **Lapor Kerusakan** (lihat §2.2) serta **Ajukan Pemindahan** (lihat §6, PMD-01..07) sesuai hak role.
> 

| ID | Aturan |
| --- | --- |
| SCN-01 | Admin memilih ruangan sebelum mulai scan; sistem load baseline ruangan (daftar barang terdaftar di ruangan). |
| SCN-02 | Setiap QR yang discan dicocokkan **real-time** terhadap baseline ruangan / barang terdaftar (uji `KP-11`). |
| SCN-03 | Hasil per barang: `COCOK` (√ hijau), `TIDAK_COCOK` (⚠ kuning), `TIDAK_TERDAFTAR` (✗ merah). |
| SCN-04 | Jika `TIDAK_COCOK`, tampilkan: “Seharusnya barang ini ada di Ruangan [X], Gedung [Y]” (uji `KP-12`). |
| SCN-05 | Saat sesi selesai, sistem menghitung ringkasan: jumlah cocok, tidak cocok, tidak terdaftar, dan **hilang** (terdaftar di ruangan tapi tidak discan) (uji `KP-16`). |
| SCN-06 | Setiap sesi scan disimpan sebagai **snapshot permanen** (tidak bisa diubah setelah selesai). |
| SCN-07 | Barang yang `COCOK` di-set `flag_verifikasi = TERVERIFIKASI`. |
| SCN-08 | Tindak lanjut anomali dilakukan **setelah sesi selesai** dan mendukung **aksi batch** (pilih beberapa item lalu terapkan sekaligus). Tindakan: "Catat & Tandai" (default untuk barang asing yang terdaftar di ruangan lain — lokasi tidak otomatis diubah), "Perbaiki Lokasi" (update `lokasi_aktual`, opsional dan manual), "Sesuaikan Lokasi Terdaftar" (update `lokasi_terdaftar`), atau "Tandai Hilang" (set `status_barang = HILANG`). |
| SCN-09 | Barang `TIDAK_TERDAFTAR` (QR tak dikenal) dicatat & ditandai `ANOMALI`; barang **hilang** (terdaftar di ruangan tapi tak discan) saat sesi selesai diberi `status_barang = HILANG` lebih dulu (penghapusan menyusul terpisah bila perlu, sumber `STOCK_OPNAME`). Tidak ada penambahan atau perubahan data lain secara otomatis dari layar hasil scan. |
| SCN-10 | Performa matching online harus **< 1 detik** per scan (lihat NFR). |
| SCN-11 | Sesi scan melakukan **auto-save tiap scan**; sesi berstatus `AKTIF` dapat **dijeda lalu dilanjutkan** kapan saja (tidak wajib sekali jalan) hingga pengelola menandainya `SELESAI`. |
| SCN-12 | **Perangkat input MVP**: scan lewat **kamera ponsel/tablet** (mobile). Input manual kode dan USB scanner direncanakan Tahap 2. |
| SCN-13 | **Stock Opname = proses bisnis terjadwal** (mis. per **tahun anggaran**, 1 Jan s/d 31 Des), berbeda dari laporan kerusakan yang insidental. Scan Cepat/QR adalah **alat** untuk menjalankan opname. |
| SCN-14 | Sesi stock opname menyimpan: **tahun anggaran**, **pembuat** (`dibuat_oleh`), **status**, **keterangan singkat**, serta audit `created_at`/`updated_at`/`updated_by`. |
| SCN-15 | Tiap baris detail opname menyimpan **lokasi aktual** hasil scan (`ruangan_aktual_id`), **kondisi** singkat (mengikuti `kondisi` barang), dan opsional **foto barang**. |
| SCN-16 | QR **tidak disimpan** di tabel stock opname; QR hanya **alat pelacakan**. **Lokasi aktual** (`ruangan_aktual_id`) ditetapkan dengan memindai **QR Ruangan** (`t=ruangan`), sedangkan **QR Barang** (`t=barang`) dipakai untuk mencocokkan identitas barang menuju `id` barang. |

---

## 11. Aturan Dua Laporan Lokasi vs Verifikasi (penting — sering tertukar)

| Aspek | 📍 Laporan Lokasi Barang | 📋 Laporan Hasil Verifikasi Scan |
| --- | --- | --- |
| Update | **Real-time**, selalu terkini | **Per sesi**, snapshot tidak berubah |
| Sumber | `lokasi_terdaftar` vs `lokasi_aktual` di tabel Barang | Tabel `stock_opname`  • `stock_opname_detail` |
| Histori | Tidak ada (hanya kondisi sekarang) | Ada (bisa lihat sesi lalu) |
| Tindak lanjut | Bisa edit langsung | Hanya catatan, tidak bisa edit |
| Tujuan | Audit administrasi | Audit fisik & bukti kegiatan |

| ID | Aturan |
| --- | --- |
| RPT-01 | Laporan Lokasi update otomatis saat: approve pemindahan, pemindahan langsung, edit manual lokasi, perbaikan dari anomali scan. |
| RPT-02 | Laporan Lokasi menampilkan barang dengan `lokasi_terdaftar ≠ lokasi_aktual`. |
| RPT-03 | Laporan Verifikasi Scan dibentuk saat sesi selesai; setiap sesi = 1 arsip. |
| RPT-04 | Ketika admin pilih “Perbaiki Lokasi” dari anomali: update masuk ke Laporan Lokasi (real-time), tapi anomali **tetap tercatat** di Laporan Scan sesi tsb. Kedua laporan terhubung tapi independen. |

---

## 12. Aturan Cetak QR Label

| ID | Aturan |
| --- | --- |
| LBL-01 | Label berisi: QR Code, kode barang (bold), nama barang singkat, logo instansi (uji `KP-22`). |
| LBL-02 | Ukuran label default ~6 × 2.5 cm; dapat dicetak dari kertas HVS A4 (uji `KP-23`). |
| LBL-03 | Layout A4 batch per ruangan, ~10–12 label/halaman (uji `KP-21`). |
| LBL-04 | Nama barang terlalu panjang → otomatis dipersingkat/font diperkecil agar muat (uji 1H). |
| LBL-05 | Admin bisa upload logo instansi (rekomendasi ≥ 300×300px) yang muncul di setiap label (uji `KP-24`). |
| LBL-06 | PDF/halaman cetak menyertakan **garis potong (crop marks)** & nomor urut kecil agar mudah dipotong & ditempel benar. |
| LBL-07 | Sistem mencatat **log cetak** (ruangan, admin, tanggal, jumlah label). |

---

## 13. Aturan Export & Berbagi

| ID | Aturan |
| --- | --- |
| EXP-01 | Export laporan/daftar **hanya** untuk role pengelola berizin — Inventaris (global) atau PJ Ruang/Laboran (area-nya). `PENGGUNA` tidak boleh export seluruh inventaris (uji `KP-10`). |
| EXP-02 | Format export: Excel (XLSX) & PDF. |
| EXP-03 | Export daftar barang untuk universitas = filter + unduh; **tidak ada pengiriman otomatis** (uji `KP-19`). |
| EXP-04 | Setiap export mengikuti hak akses & scope role pengekspor. |

---

## 14. Audit Trail & Riwayat

| ID | Aturan |
| --- | --- |
| AUD-01 | Setiap perubahan penting (barang, lokasi, status, pengajuan, hasil scan) dapat ditelusuri: siapa, apa, kapan (uji `KP-09`). |
| AUD-02 | Riwayat barang membentuk timeline yang ditampilkan ke admin (uji `KP-07`). |
| AUD-03 | Semua operasi tulis mencatat aktor dari sesi login (bukan input bebas). |

---

## 15. Kebutuhan Non-Fungsional (NFR)

| Kategori | Spesifikasi |
| --- | --- |
| Performa | Operasi umum < 3 dtk; **matching scan online < 1 dtk**. |
| Keamanan | JWT cookie httpOnly, RBAC, password hashed (bcrypt), audit trail, validasi input server-side, proteksi terhadap injeksi (Prisma parameterized). |
| Kerahasiaan | Data & laporan hanya untuk role berhak; export dibatasi role. |
| Usability | UI sederhana, Bahasa Indonesia, berbasis aksi; **tombol scan besar** + feedback visual hijau/kuning/merah. |
| Kompatibilitas | Browser modern desktop/tablet/HP; **wajib dukung kamera mobile Android/iOS** untuk scan. |
| Reliability | Backup berkala; sesi scan tersimpan; (Tahap 2) tahan koneksi putus. |
| Maintainability | Master data, role, kategori approval, format label mudah dipelihara; kode berlapis (route handler → service → repository). |
| Scalability | Tambah gedung/ruangan/barang/user tanpa ubah alur inti. |
| Availability | Tersedia jam operasional; siap dikembangkan 24/7. |

---

## 16. Penanganan Error (pedoman)

| Situasi | Perilaku yang diharapkan |
| --- | --- |
| Validasi gagal | Tampilkan pesan per-field jelas (Bahasa Indonesia), tidak menyimpan data. |
| Tidak berhak (RBAC) | Tolak (HTTP 403) + pesan “Anda tidak memiliki akses.” |
| Belum login / token kadaluarsa | Arahkan ke login (HTTP 401). |
| Kode duplikat | Tolak dengan pesan “Kode barang sudah digunakan.” |
| QR tak dikenal saat scan | Tampilkan ✗ merah lalu **catat & tandai sebagai anomali** (`TIDAK_TERDAFTAR`) untuk ditindaklanjuti setelah sesi; tidak ada penambahan data otomatis dari layar hasil scan (selaras SCN-09). |
| File foto > batas | Auto-kompres; jika tetap gagal, tolak dengan pesan ukuran. |
| Error server | Pesan ramah + log internal; jangan bocorkan stack trace ke user. |

---

## 17. Aturan Notifikasi In-App (FU-09)

| ID | Aturan |
| --- | --- |
| NTF-01 | Notifikasi MVP **in-app saja** (real-time), disimpan di tabel `notifikasi`; email menyusul (Tahap 2). |
| NTF-02 | Notifikasi ditujukan ke penerima relevan per kejadian. Pengguna (pengaju): perubahan status pengajuan pemindahan (`DISETUJUI`/`DITOLAK`/`SELESAI`/`DIBATALKAN`) & permintaan `REVISI`, serta status laporan kerusakan miliknya (lihat LAP-07). PJ_RUANG/LABORAN: pengajuan/laporan baru di area + reminder maintenance jatuh tempo (FA-26). INVENTARIS: usulan penghapusan baru / pengajuan butuh validasi (FA-07). |
| NTF-03 | UI menampilkan **ikon lonceng**  • **badge jumlah belum dibaca**; daftar diurutkan terbaru di atas dengan judul, ringkasan, waktu, dan status dibaca. |
| NTF-04 | Klik notifikasi → arahkan ke detail terkait (pengajuan/laporan/barang) & set `dibaca = true` otomatis. |
| NTF-05 | Tersedia aksi **Tandai semua sudah dibaca**. |
| NTF-06 | Tiap notifikasi menyimpan: penerima, tipe, referensi sumber, pesan, status dibaca, waktu. Notifikasi **hanya** terlihat oleh penerimanya. |
| NTF-07 | Pembuatan notifikasi adalah **efek samping** perubahan status (pengajuan/laporan/maintenance) di service layer; kegagalan kirim notifikasi tidak membatalkan transaksi utama. |

---

## 18. Aturan Lihat & Telusur Status Barang (FU-10)

| ID | Aturan |
| --- | --- |
| VWB-01 | `PENGGUNA` (Civitas) dapat **menelusuri seluruh barang fakultas** secara **read-only** lewat **satu daftar global** (lintas ruangan), tanpa mengelola data. |
| VWB-02 | Daftar global menyediakan **pencarian** (kode/nama) dan **filter**: ruangan, status barang, dan jenis barang. |
| VWB-03 | Detail barang untuk Pengguna menampilkan **lokasi & info dasar** (kode, nama, jenis, ruangan) serta **kondisi** dan **status barang** (termasuk `TERJADWAL_PERAWATAN` sebagai status). |
| VWB-04 | **Jadwal/tanggal maintenance preventif tidak ditampilkan** ke `PENGGUNA`; detail jadwal hanya untuk `PJ_RUANG`/`LABORAN`/`INVENTARIS`. Pengguna hanya melihat status, bukan tanggal jatuh tempo. |
| VWB-05 | Dari detail barang, Pengguna dapat memicu aksi cepat **Lapor Kerusakan** (FU-06) & **Ajukan Pemindahan** (FU-05) sesuai hak; akses baca tidak mengubah data apa pun. |

---

## 19. Kriteria Penerimaan (Acceptance Criteria)

Sistem dianggap memenuhi MVP bila seluruh kriteria berikut lulus.

| ID | Kriteria |
| --- | --- |
| KP-01 | Pengguna (Civitas) login dengan email UNS, bisa lapor & mengajukan; PJ Ruang/Laboran hanya mengelola area yang di-assign. |
| KP-02 | Inventaris melihat seluruh data agregat fakultas & mengelola akun/role (FA-11); Pimpinan read-only global. |
| KP-03 | Kode barang unik; sistem menolak duplikat. |
| KP-04 | Pemindahan masuk antrian approval (jika wajib) atau langsung tercatat (jika tidak). |
| KP-05 | Approve pemindahan → lokasi barang otomatis diperbarui. |
| KP-06 | Lapor kerusakan dengan deskripsi + foto berhasil. |
| KP-07 | Riwayat perubahan status/lokasi/kondisi tersimpan. |
| KP-08 | Laporan inventaris bisa difilter lokasi/jenis/kondisi/status/periode. |
| KP-09 | Audit trail tercatat untuk aktivitas penting. |
| KP-10 | Export hanya untuk role pengelola berizin. |
| KP-11 | Scan Cepat matching real-time + feedback visual. |
| KP-12 | Barang tidak cocok → notifikasi lokasi seharusnya (“Seharusnya di Ruangan X, Gedung Y”). |
| KP-13 | Filter barang penanganan khusus berfungsi. |
| KP-14 | Admin bisa set kategori barang wajib/tidak wajib approval. |
| KP-15 | Plan B (input manual massal) + auto-generate kode jika Excel tak tersedia. |
| KP-16 | Sesi scan tersimpan lengkap (termasuk barang hilang & asing). |
| KP-17 | Admin melihat histori tahunan usulan penghapusan. |
| KP-18 | Admin export daftar barang (Excel/PDF) untuk diserahkan manual. |
| KP-19 | Sistem tidak kirim data otomatis ke universitas. |
| KP-20 | Setiap barang otomatis punya QR digital. |
| KP-21 | Cetak QR label batch per ruangan (PDF A4, 10–12 label/halaman). |
| KP-22 | Label berisi QR, kode, nama singkat, logo. |
| KP-23 | Ukuran label ~6×2.5 cm, bisa dipotong dari HVS A4. |
| KP-24 | Admin upload logo instansi yang muncul di label. |
| KP-25 | SOP input awal launch tersedia & jelas dalam sistem. |