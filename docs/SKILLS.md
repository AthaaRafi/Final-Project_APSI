# SKILLS

# SKILLS — Playbook & Prompt untuk AI

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Kumpulan **prosedur berulang (playbook)** + **prompt siap pakai** agar AI mengeksekusi konsisten dan tidak mengulang kerja. Tiap skill: kapan dipakai → langkah → selesai bila. Patuhi `RULES.md` & `AGENTS.md`.
> 

---

## A. Cara pakai dokumen ini

- **Awal sesi:** baca `INDEX.md` -> `AGENTS.md` -> `TASK_BREAKDOWN.md` (cari task `[ ]` paling awal yang dependensinya sudah `[x]`).
- **Saat kerja:** pilih playbook yang cocok di bawah, ikuti langkahnya, penuhi Definition of Done (`AGENTS.md` §9).
- **Akhir task:** update `TASK_BREAKDOWN.md`; catat keputusan baru di `DECISIONS.md`; update dokumen yang jadi stale.

---

## B. Playbook (prosedur)

### SKILL-1 — Tambah domain backend baru

**Kapan:** butuh CRUD/aksi entitas baru.
**Langkah:**

1. Baca domain sejenis (mis. `barang`, `pengajuan`).
2. Tambah/ubah model di `schema.prisma` (forward-only) -> `prisma migrate dev --name <domain>`.
3. Tulis skema Zod di `lib/validation/<domain>.ts`.
4. `repositories/<domain>.repo.ts` (query Prisma) -> `services/<domain>.service.ts` (aturan SRS, transaksi, audit) -> `app/api/<domain>/route.ts` (auth + Zod + delegasi).
5. Tambah `requireRole(...)` + scope area bila perlu.
6. Tulis `RiwayatBarang`/`AuditLog` untuk operasi tulis.

**Selesai bila:** typecheck/lint bersih, endpoint mengembalikan envelope `{ data }`, aturan ditegakkan di service, audit tertulis, task & docs diperbarui.

### SKILL-2 — Tambah halaman/flow frontend

**Kapan:** butuh UI baru untuk domain.
**Langkah:**

1. Baca page sejenis. Tentukan route group yang benar.
2. Tambah API client + tipe + query key (`lib/api/query-keys.ts`).
3. Pakai React Query (`enabled` untuk prasyarat) + invalidate setelah mutasi.
4. Pakai komponen shared (`DataTable`, `FormField`, `StatusBadge`) + warna status kanonik (`UIUX_FLOW.md` §3).
5. Tambah menu sidebar + cek guard `src/proxy.ts` (dulu `middleware.ts`).

**Selesai bila:** kolom list/detail/form konsisten, tidak ada reload halaman, role UI cocok dengan backend.

### SKILL-3 — Tambah/ubah aturan bisnis

**Langkah:** ubah **service** lebih dulu -> sesuaikan tipe & komponen frontend -> update `SRS`/`SDD` bila kontrak berubah -> catat di `DECISIONS.md` bila keputusan baru.
**Selesai bila:** dokumen & kode sinkron, tidak ada aturan bisnis bocor ke frontend.

### SKILL-4 — Ubah skema database

**Langkah:** edit `schema.prisma` -> migrasi **baru** forward-only (jangan edit migrasi lama) -> sesuaikan repository/service/Zod -> seed bila perlu.
**Selesai bila:** migrasi jalan, data existing aman, index pada kolom yang sering difilter.

### SKILL-5 — Tambah endpoint scan/opname

**Langkah:** ikuti kontrak SDD §6.3 (matching), pastikan baseline = barang terdaftar ruangan, auto-save tiap match, sesi `SELESAI` jadi snapshot permanen, tindak lanjut anomali batch (HILANG / catat asing).
**Selesai bila:** matching < 1 dtk, sesi selesai tidak bisa diubah.

### SKILL-6 — Update dokumentasi setelah perubahan

**Langkah:** identifikasi dokumen stale (`SRS/SDD/AGENTS/UIUX`), update di task yang sama, sinkronkan istilah (Stock Opname, `kode_ruangan`, status HILANG), jangan ubah `[KODE_RUANG]` placeholder format kode barang.

---

## C. Prompt siap pakai (template)

> Ganti bagian dalam kurung. Tempel ke Claude Code.
> 

### Prompt: mulai sesi kerja

```
Baca docs/INDEX.md, AGENTS.md (CLAUDE.md), RULES.md, dan TASK_BREAKDOWN.md.
Pilih task [ ] paling awal yang dependensinya sudah selesai. Ringkas rencanamu
(1 paragraf) dan tunggu konfirmasi sebelum menulis kode besar.
```

### Prompt: kerjakan satu task

```
Kerjakan task [ID TASK] dari TASK_BREAKDOWN.md. Ikuti playbook yang relevan di
docs/SKILLS.md dan aturan di RULES.md. Aturan bisnis di backend (service).
Setelah selesai: jalankan typecheck & lint, update TASK_BREAKDOWN.md, dan sebutkan
command apa pun yang perlu kujalankan manual (mis. migrate/seed).
```

### Prompt: tambah domain

```
Tambah domain [NAMA] mengikuti SKILL-1 di docs/SKILLS.md. Baca domain [CONTOH]
sebagai acuan pola. Jangan introduce dependency/pattern baru tanpa diskusi.
```

### Prompt: review sebelum tandai selesai

```
Verifikasi task [ID] terhadap Definition of Done (AGENTS.md §9) dan skenario terkait
di TESTING.md. Sebutkan yang belum terpenuhi. Jangan tandai [x] bila DoD belum lengkap.
```

### Prompt: pengambilan keputusan

```
Ada pilihan desain pada [TOPIK]. Jangan langsung kode. Beri 2–3 opsi + trade-off,
rekomendasi, lalu tunggu keputusan. Setelah diputuskan, catat sebagai ADR baru di
docs/DECISIONS.md.
```

---

## D. Anti-pattern (hindari)

- Menaruh aturan bisnis / query Prisma di komponen React atau Route Handler.
- Fallback frontend untuk menutupi bug backend.
- Reload halaman untuk refresh data; query key ad-hoc.
- Mengedit migrasi lama; hard delete barang; commit `.env`.
- Mengubah hasil sesi opname `SELESAI`; melewati cek kategori approval; role rangkap.
- Membalik keputusan terkunci di `DECISIONS.md` tanpa diskusi.