# Generate Database — Rencana Data Dummy

> **Status:** Rencana (belum dieksekusi) · **Tanggal:** 18 Juni 2026
> Dokumen ini adalah rencana lengkap untuk men-generate data dummy berskala besar ke database, karena data resmi fakultas belum tersedia. Eksekusi dilakukan setelah rencana ini disetujui.

---

## 1. Tujuan & Keputusan

**Tujuan:** Mengisi database dengan data dummy realistis & berskala besar agar seluruh layar (dashboard, tabel, laporan, pagination) terlihat penuh dan dapat diuji performanya.

**Keputusan yang sudah dikunci (hasil diskusi):**

| Aspek | Keputusan |
| --- | --- |
| Skala | **6 gedung · 150 ruangan · ~10.000 barang · 60 akun** |
| Strategi seed | **Script terpisah** — `prisma/seed-dummy.ts` (tidak mengganggu `seed.ts` dev) |
| Kedalaman | **Lengkap & realistis** — master + transaksi + riwayat + notifikasi + audit |
| Library random | **`@faker-js/faker`** (locale `id_ID` untuk nama Indonesia) |
| Distribusi barang | **Seimbang** — semua kondisi & status barang terwakili banyak |
| Format kode barang | **Resmi & unik** — `[JENIS]-[TAHUN]-[KODE_RUANG]-[NOMOR_URUT]`, nomorUrut increment per (jenis + ruangan + tahun) |

---

## 2. Prinsip & Batasan (Aturan Keras)

- **Hanya menambah data, tidak mengubah skema/aturan bisnis.** Tidak menyentuh `schema.prisma`, service, repository, API, atau Zod.
- **Idempoten secukupnya:** script dummy memakai prefix id `dummy-*` agar mudah dibedakan & dibersihkan. Dijalankan ulang akan menghapus data `dummy-*` lama dulu (opsi `--reset`), lalu generate baru.
- **Tidak mengganggu seed dev:** 5 akun login (`admin@uns.ac.id` dst) + 5 barang contoh dari `seed.ts` tetap utuh. Script dummy hanya menambah entitas baru ber-id `dummy-*`.
- **Konsistensi domain:** kode barang ikut format SRS; `lokasiAktual` default = `lokasiTerdaftar` kecuali sengaja dibuat "berbeda" untuk anomali; QR barang & ruangan dibuat sesuai pola payload yang sudah ada.
- **Password akun dummy:** semua pakai 1 hash bcrypt yang sama (mis. `dummy123`) — dicatat di komentar, bukan plaintext acak, agar bisa dipakai login saat demo.
- **Performa:** gunakan `createMany` (batch) untuk tabel besar (barang, qr, riwayat, notifikasi, audit) dengan `skipDuplicates`. Hindari `await` per-baris di loop 10.000×. Target waktu seed < 2 menit.

---

## 3. Rincian Volume per Entitas

| Entitas | Jumlah | Catatan |
| --- | --- | --- |
| **Gedung** | 6 | `GA`–`GF`, nama "Gedung A".."Gedung F" |
| **Ruangan** | 150 | tersebar di 6 gedung (~25/gedung), 1–4 lantai; mix `KELAS` & `LABORATORIUM` (~70/30) |
| **Jenis Barang** | ~12 | MEJA, KURSI, AC, KOMPUTER, APAR, PROYEKTOR, PRINTER, LEMARI, WHITEBOARD, ROUTER, SWITCH, GENSET |
| **Kategori Approval** | 2 | reuse Elektronik (wajib) & Mebel (tidak) dari seed |
| **Akun (User)** | 60 | 1 INVENTARIS tambahan, ~3 PIMPINAN, ~25 PJ_RUANG, ~15 LABORAN, ~16 PENGGUNA |
| **UserRuangan** | ~120 | tiap PJ_RUANG/LABORAN di-assign 1–4 ruangan (tak overlap antar PJ) |
| **Barang** | ~10.000 | tersebar di 150 ruangan (~66/ruangan), distribusi kondisi/status seimbang |
| **QrCode (barang)** | ~10.000 | 1 QR aktif per barang |
| **QrCode (ruangan)** | 150 | 1 QR per ruangan |
| **Pengajuan** | ~800 | mix PEMINDAHAN/KERUSAKAN/PENGHAPUSAN, berbagai status |
| **RiwayatBarang** | ~3.000 | minimal entri "dibuat" + entri untuk barang yang punya transaksi |
| **StockOpname** | ~120 | sesi SELESAI di sebagian ruangan, lengkap dengan summary count |
| **StockOpnameDetail** | ~8.000 | detail per sesi (cocok/tidak cocok/tidak terdaftar) |
| **Notifikasi** | ~1.500 | tersebar ke akun, mix dibaca/belum |
| **AuditLog** | ~2.000 | CREATE/UPDATE entitas penting |
| **JadwalMaintenance** | ~12 | per jenis barang yang relevan (AC, APAR, GENSET, dll) |
| **LogCetakLabel** | ~150 | 1 entri per ruangan yang "pernah cetak" |
| **KonfigurasiLabel** | 1 | reuse dari seed (tidak digandakan) |

> Angka transaksi bersifat target; bisa di-tweak lewat konstanta di atas script.

---

## 4. Strategi Generasi per Entitas

### 4.1 Gedung & Ruangan
- 6 gedung `GA`–`GF`.
- 150 ruangan dibagikan ke gedung. Kode ruangan unik: pola `R{gedungHuruf}{lantai}{nomor}` (mis. `RA201`) untuk kelas, `LAB-{gedung}{n}` untuk laboratorium. Pastikan `@unique kodeRuangan` aman.
- `tipe`: ~70% KELAS, ~30% LABORATORIUM. `lantai`: 1–4.

### 4.2 Jenis Barang & Kategori
- 12 jenis dengan kode unik (huruf kapital). Reuse 5 jenis dari seed bila id belum ada (`upsert`/`skipDuplicates`).
- Kategori approval: reuse `seed-kategori-elektronik` & `seed-kategori-mebel`. Mapping: barang elektronik (AC, KOMPUTER, PROYEKTOR, dll) → Elektronik (wajib approval); mebel (MEJA, KURSI, LEMARI) → Mebel.

### 4.3 Akun (User) & UserRuangan
- 60 akun, id `dummy-user-{n}`, email `dummy{n}@staff.uns.ac.id` / `@student.uns.ac.id`.
- Nama via `faker.person.fullName()` locale id_ID.
- Semua `status = ACTIVE`, `emailVerifiedAt` terisi, 1 hash password sama.
- Komposisi role sesuai tabel §3.
- PJ_RUANG & LABORAN di-assign ruangan unik (round-robin tanpa overlap) → tabel `user_ruangan`.

### 4.4 Barang (inti, ~10.000)
- Loop per ruangan, generate ~66 barang/ruangan (acak 40–90).
- **Kode unik:** counter `nomorUrut` per kombinasi `(jenisKode, kodeRuangan, tahun)`; kode = `${jenisKode}-${tahun}-${kodeRuangan}-${String(nomorUrut).padStart(4,"0")}`.
- `tahunPembelian`: acak 2018–2025.
- **Distribusi seimbang (per permintaan):** kondisi & status disebar agar semua nilai enum muncul signifikan:
  - `kondisi`: BAIK / RUSAK_RINGAN / RUSAK_BERAT (≈ 50/30/20).
  - `statusBarang`: NORMAL, DILAPORKAN_RUSAK, MENUNGGU_VALIDASI, DALAM_PERAWATAN, TERJADWAL_PERAWATAN, HILANG, DIAJUKAN_HAPUS, NONAKTIF — disebar agar tiap status punya ratusan barang.
  - `flagVerifikasi`: BELUM / TERVERIFIKASI / ANOMALI.
- `lokasiAktualId`: ~90% sama dengan `lokasiTerdaftarId`; ~10% berbeda (pinjam ruangan lain) → memunculkan anomali di Laporan Lokasi.
- `penguasaan`: nama prodi/unit acak dari array tetap.
- Insert via `createMany` per batch (mis. 1.000/batch).

### 4.5 QrCode
- 1 QR `BARANG` aktif per barang (payload JSON pola sama seperti `seed.ts`).
- 1 QR `RUANGAN` per ruangan.
- Insert batch `createMany`.

### 4.6 Pengajuan + Lampiran
- ~800 pengajuan menunjuk barang acak.
- `nomor` unik (mis. `PGJ-{tahun}-{counter}`).
- Jenis & status disebar: MENUNGGU, DISETUJUI, DITOLAK, REVISI, SELESAI, LANGSUNG_TERCATAT, DIBATALKAN.
- PEMINDAHAN: isi `lokasiAsalId`/`lokasiTujuanId`, sebagian `isAntarArea = true`.
- PENGHAPUSAN: isi `sumber` (LAPORAN_KERUSAKAN/STOCK_OPNAME/MANUAL).
- `pengajuId`: akun acak yang sesuai (PJ/LABORAN/PENGGUNA).

### 4.7 RiwayatBarang
- Minimal 1 entri "Barang ditambahkan" per sebagian barang + entri tambahan untuk barang yang punya pengajuan/opname.
- `aktor`: nama/email akun acak.

### 4.8 StockOpname + Detail
- ~120 sesi, sebagian besar `SELESAI` (snapshot permanen), sebagian `AKTIF`.
- Tiap sesi menunjuk 1 ruangan + 1 admin (INVENTARIS/PJ).
- Detail per sesi: ambil barang baseline ruangan tsb, tandai COCOK/TIDAK_COCOK/TIDAK_TERDAFTAR; isi summary count (`jumlahCocok`, dst) konsisten dengan detail.

### 4.9 Notifikasi, AuditLog, JadwalMaintenance, LogCetakLabel
- Notifikasi: ~1.500, tipe acak dari enum `TipeNotifikasi`, ~40% `dibaca = true`.
- AuditLog: ~2.000 entri CREATE/UPDATE (entitas Barang/Pengajuan/User/Ruangan).
- JadwalMaintenance: per jenis relevan, `intervalBulan` 1/3/6/12, sebagian `nextDueDate` lewat (memunculkan "jatuh tempo").
- LogCetakLabel: 1 entri per ~150 ruangan.

---

## 5. Struktur Script (`prisma/seed-dummy.ts`)

```
prisma/seed-dummy.ts
├── KONSTANTA (jumlah target tiap entitas — mudah di-tweak)
├── helper: pick(), pickWeighted(), batchInsert()
├── 0. (opsi --reset) hapus semua data ber-id prefix "dummy-"
├── 1. ensureMasterJenisKategori()   // upsert jenis & kategori
├── 2. generateGedungRuangan()       // 6 gedung, 150 ruangan
├── 3. generateUsers()               // 60 akun + userRuangan
├── 4. generateBarang()              // ~10.000 (batch) + counter kode unik
├── 5. generateQr()                  // QR barang + ruangan (batch)
├── 6. generatePengajuan()           // ~800 + lampiran
├── 7. generateRiwayat()             // ~3.000
├── 8. generateStockOpname()         // ~120 sesi + ~8.000 detail
├── 9. generateNotifikasiAuditDll()  // notif, audit, jadwal, logcetak
└── main() → urut sesuai dependensi (FK aman), log progres per langkah
```

**Urutan eksekusi wajib (karena FK):**
Gedung → Ruangan → Jenis/Kategori → User → UserRuangan → Barang → QrCode → Pengajuan → Riwayat → StockOpname → StockOpnameDetail → Notifikasi/Audit/Jadwal/LogCetak.

---

## 6. Cara Menjalankan (rencana command)

> Command butuh MySQL lokal → **dijalankan oleh user** secara manual.

```bash
# 1. (sekali) install faker sebagai dev-dependency
npm i -D @faker-js/faker

# 2. tambahkan script di package.json:
#    "seed:dummy": "tsx prisma/seed-dummy.ts"
#    "seed:dummy:reset": "tsx prisma/seed-dummy.ts --reset"

# 3. jalankan
npm run seed:dummy          # tambah data dummy
npm run seed:dummy:reset    # hapus dummy lama lalu generate ulang
```

**Prasyarat:** `npx prisma migrate dev` sudah dijalankan & seed dev (`npx prisma db seed`) sudah mengisi 5 akun login + master dasar.

---

## 7. Verifikasi Setelah Seed

1. `npx prisma studio` → cek jumlah baris tiap tabel mendekati target §3.
2. Login `admin@uns.ac.id` → Dashboard Global menampilkan angka besar (ribuan barang, breakdown kondisi).
3. Halaman Data Barang → pagination jalan, ribuan baris, semua status badge muncul.
4. Laporan Lokasi → muncul barang dengan lokasi aktual ≠ terdaftar.
5. Laporan Stock Opname → daftar sesi SELESAI terisi.
6. Akun & Role → 60+ akun, mix role & status.
7. Notifikasi → badge unread muncul.

---

## 8. Rollback / Pembersihan

- `npm run seed:dummy:reset` menghapus semua entitas ber-id prefix `dummy-` lalu generate ulang.
- Untuk hapus total tanpa generate ulang: flag `--clean-only` (hanya hapus `dummy-*`).
- Seed dev (`seed-*` id) tidak ikut terhapus.
- Alternatif drastis (hapus semua): `npx prisma migrate reset` lalu seed dev ulang (menghapus SELURUH data, hati-hati).

---

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Insert 10.000 baris lambat / timeout | `createMany` batch 1.000, bukan await per-baris |
| Bentrok `@unique` (kodeBarang, email, kodeRuangan, nomor) | counter deterministik + prefix `dummy-`; `skipDuplicates` |
| FK gagal (urutan salah) | urutan eksekusi §5 ditegakkan; id parent disimpan di memori sebelum insert child |
| Data tak realistis untuk laporan | distribusi status disebar + 10% lokasi anomali + opname SELESAI |
| Mengotori akun login dev | semua dummy ber-id `dummy-*`, email `dummy{n}@...`, terpisah dari seed dev |
| Summary opname tak konsisten dgn detail | hitung count dari detail yang sama, bukan angka acak terpisah |

---

## 10. Checklist Eksekusi (untuk fase berikutnya)

- [ ] Install `@faker-js/faker` (dev)
- [ ] Tambah script `seed:dummy` & `seed:dummy:reset` di `package.json`
- [ ] Tulis `prisma/seed-dummy.ts` sesuai struktur §5
- [ ] Jalankan `npm run seed:dummy` (oleh user, butuh MySQL)
- [ ] Verifikasi via Prisma Studio & UI (§7)
- [ ] Catat hasil & angka aktual di bagian "Hasil Eksekusi" (ditambah setelah run)
