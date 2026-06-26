# INDEX

# INDEX — Peta Dokumen & Entry Point

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Mulai dari sini. Dokumen ini merutekan “baca apa untuk apa”. Untuk Claude Code, `AGENTS.md` disalin/rename jadi `CLAUDE.md` di root; sisanya di `docs/`.
> 

---

## 1. Urutan baca (AI & kontributor baru)

1. **INDEX** (ini) — peta dokumen.
2. [AGENTS](https://app.notion.com/p/AGENTS-37aaabe17e0c8059822ad4849a9fc208?pvs=21) (= `CLAUDE.md`) — aturan kerja, struktur, konvensi, DoD.
3. [RULES](https://app.notion.com/p/RULES-37aaabe17e0c8083949ed9ed9eb63dae?pvs=21) — batasan keras (boleh/dilarang).
4. [ENVIRONMENT](https://app.notion.com/p/ENVIRONMENT-a55c9973672d411dac452cc108dbeedf?pvs=21) — Fase 0: setup proyek dari nol.
5. [TASK_BREAKDOWN](https://app.notion.com/p/TASK_BREAKDOWN-37aaabe17e0c802cbf04c6aa1586585e?pvs=21) — pilih task berikutnya (urut fase & dependensi).
6. [SKILLS](https://app.notion.com/p/SKILLS-0c1f2cdff7e64d7481e325f539b9792b?pvs=21) — playbook & prompt eksekusi.

---

## 2. Baca apa untuk apa (file routing)

| Kebutuhan | Dokumen |
| --- | --- |
| Apa & untuk siapa (produk, fitur, role, alur) | [PRD](https://app.notion.com/p/PRD-378aabe17e0c8023940ced90971c92f7?pvs=21) |
| Aturan bisnis & kriteria penerimaan (perilaku detail) | [SRS](https://app.notion.com/p/SRS-378aabe17e0c804aac48fe69acd63858?pvs=21) |
| Desain teknis (arsitektur, schema, API, auth) | [SDD](https://app.notion.com/p/SDD-378aabe17e0c80cfa63cd884075e33d4?pvs=21) |
| ERD / kamus data (tabel & kolom) | [Desain Database (Acuan ERD)](https://app.notion.com/p/Desain-Database-Acuan-ERD-490762ffc1c44928b8f420a3463bae4c?pvs=21) |
| Tampilan, navigasi, warna status, wireframe | [UIUX_FLOW](https://app.notion.com/p/UIUX_FLOW-4d1b600cf14d4779963acaa3a3fec55f?pvs=21) |
| Aturan kerja AI, konvensi, Definition of Done | [AGENTS](https://app.notion.com/p/AGENTS-37aaabe17e0c8059822ad4849a9fc208?pvs=21) |
| Batasan keras (boleh/dilarang) | [RULES](https://app.notion.com/p/RULES-37aaabe17e0c8083949ed9ed9eb63dae?pvs=21) |
| Daftar task per fase & progress | [TASK_BREAKDOWN](https://app.notion.com/p/TASK_BREAKDOWN-37aaabe17e0c802cbf04c6aa1586585e?pvs=21) |
| Keputusan terkunci + alasannya (ADR) | [DECISIONS](https://app.notion.com/p/DECISIONS-e2e52c1b4fe24c92b56b451ae0ec30a2?pvs=21) |
| Setup & bootstrap (Fase 0), env, command | [ENVIRONMENT](https://app.notion.com/p/ENVIRONMENT-a55c9973672d411dac452cc108dbeedf?pvs=21) |
| Rencana uji, data seed, akun demo | [TESTING](https://app.notion.com/p/TESTING-b982fc444dd34912857c72f2117efe6e?pvs=21) |
| Playbook prosedur & prompt siap pakai | [SKILLS](https://app.notion.com/p/SKILLS-0c1f2cdff7e64d7481e325f539b9792b?pvs=21) |

---

## 3. Hirarki sumber kebenaran

1. Perilaku **service backend** yang aktif.
2. Kontrak yang sedang dipakai **frontend**.
3. Dokumen di `docs/`.

Untuk **keputusan** (kenapa sesuatu dibuat begitu): lihat [DECISIONS](https://app.notion.com/p/DECISIONS-e2e52c1b4fe24c92b56b451ae0ec30a2?pvs=21). Untuk **aturan bisnis**: [SRS](https://app.notion.com/p/SRS-378aabe17e0c804aac48fe69acd63858?pvs=21). Untuk **implementasi**: [SDD](https://app.notion.com/p/SDD-378aabe17e0c80cfa63cd884075e33d4?pvs=21) + `prisma/schema.prisma`.

---

## 4. Snapshot proyek (1 menit)

- Web inventaris barang fakultas. **Next.js App Router fullstack**, TypeScript strict, MySQL 8 + Prisma, JWT httpOnly, Tailwind + shadcn/ui, TanStack Query/Table.
- **5 role:** PENGGUNA, PJ_RUANG, LABORAN, INVENTARIS, PIMPINAN (1 akun = 1 role).
- **Scan Cepat = alat Stock Opname** (verifikasi fisik terjadwal; baseline = barang terdaftar). Pemindahan (1-area/antar-area dual approval), laporan kerusakan, penghapusan (PJ ajukan, Inventaris validasi), perawatan korektif + preventif. **Sistem mandiri** — export manual, tanpa auto-submit.

---

## 5. Status dokumen

- **Final & sinkron (12 Juni 2026):** PRD v1.2, SRS v1.2, SDD v1.2, Desain DB, AGENTS, RULES v2.0, TASK_BREAKDOWN, UIUX_FLOW, DECISIONS, ENVIRONMENT, TESTING, SKILLS.
- Bila ada perubahan: update dokumen terkait di task yang sama + catat ADR baru bila keputusan berubah.