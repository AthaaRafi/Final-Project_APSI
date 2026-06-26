# ENVIRONMENT

# ENVIRONMENT — Setup & Bootstrap (Fase 0)

> **Status:** v1.0 · **Tanggal:** 12 Juni 2026
Langkah menyiapkan proyek dari nol **sebelum** fitur dibangun. Fase 0 ini wajib selesai dulu agar task berikutnya punya fondasi yang konsisten. Teknis detail di `SDD.md`.
> 

---

## 1. Prasyarat

- **Node.js LTS ≥ 20**, **npm**.
- **MySQL 8.x** berjalan lokal (atau Docker).
- Akun email test (Mailtrap) untuk verifikasi & OTP.
- Editor + Claude Code (file `CLAUDE.md` = salinan `AGENTS.md`).

---

## 2. Urutan Bootstrap (Fase 0)

Kerjakan **berurutan**; jangan loncat:

1. **Init proyek Next.js** (App Router, TypeScript strict, ESLint, Tailwind):
    
    ```bash
    npx create-next-app@latest inventaris-fakultas --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"
    ```
    
2. **Pasang dependency inti:**
    
    ```bash
    npm i prisma @prisma/client zod jose bcryptjs @tanstack/react-query @tanstack/react-table sonner lucide-react qrcode html5-qrcode
    npm i -D @types/bcryptjs @types/qrcode
    ```
    
3. **Inisialisasi shadcn/ui** dan tambah komponen dasar (button, input, table, dialog, badge, form, sonner, dropdown-menu, select).
4. **Setup Prisma:** `npx prisma init --datasource-provider mysql`. Isi `schema.prisma` mengikuti kerangka SDD §4.2 (enum + model). Beri nama relasi eksplisit untuk 2 relasi `Barang`->`Ruangan`.
5. **Buat skeleton folder** sesuai SDD §3 (`app/(auth|pelapor|area|inventaris|supervisor)`, `lib/(auth,api,validation,storage,qr)`, `server/(services,repositories)`, `components/(ui,data-table,domain,layout)`, `storage/`).
6. **Konfigurasi env:** salin `.env.example` -> `.env`, isi `DATABASE_URL`, `JWT_SECRET`, dll.
7. **Migrasi awal:** `npx prisma migrate dev --name init`.
8. **Seed master contoh:** `npx prisma db seed` (lihat `TESTING.md` §2).
9. **Util fondasi:** `lib/db.ts` (Prisma singleton), `lib/auth/*` (jwt, password, session, rbac), `lib/api/client.ts` + `query-keys.ts`, `src/proxy.ts` (guard role, dulu `middleware.ts`), provider React Query di `app/layout.tsx`, helper response `{ data }` & error RFC 7807.
10. **Smoke test:** `npm run dev` -> halaman `/setup` muncul saat DB kosong; buat akun INVENTARIS pertama; login -> redirect `/inventaris`.

---

## 3. Environment Variables (`.env.example`)

```
DATABASE_URL="mysql://user:password@localhost:3306/inventaris"
JWT_SECRET="ganti-dengan-string-acak-panjang"
JWT_EXPIRES_IN="8h"            # remember-me diperpanjang jadi 30 hari
APP_URL="http://localhost:3000"
# Email (verifikasi akun + OTP lupa password)
MAIL_HOST="sandbox.smtp.mailtrap.io"
MAIL_PORT="2525"
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM="no-reply@inventaris.uns.ac.id"
STORAGE_DIR="./storage"
NODE_ENV="development"
```

> Jangan commit `.env`. Hanya `.env.example` yang masuk repo. Jangan print nilai secret.
> 

---

## 4. Perintah Penting

| Tujuan | Perintah |
| --- | --- |
| Dev server | `npm run dev` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Migrasi (dev) | `npx prisma migrate dev` |
| Seed | `npx prisma db seed` |
| Prisma Studio | `npx prisma studio` |
| Reset DB (hati-hati) | `npx prisma migrate reset` |

> Tambahkan script `typecheck` (`tsc --noEmit`) di `package.json`. Konfigurasi `prisma.seed` menunjuk `prisma/seed.ts`.
> 

---

## 5. Definition of Done — Fase 0

- `npm run dev`, `npm run typecheck`, `npm run lint` jalan bersih.
- Skema Prisma termigrasi; seed master contoh masuk.
- `/setup` membuat INVENTARIS pertama lalu terblokir; login redirect sesuai role.
- Skeleton folder & util fondasi (auth, db, api client, proxy, provider) ada.
- `.env.example` lengkap; `.env` tidak ter-commit.

> Catatan: command yang butuh MySQL lokal/kamera dijalankan **user**; agent menyebutkan perintahnya bila tak bisa eksekusi sendiri.
>

---

## 6. Backup & Pemulihan MySQL (NFR Reliability — T8-06)

### 6.1 Backup Manual (mysqldump)

```bash
# Backup penuh (struktur + data)
mysqldump -u <user> -p inventaris_db > backup_inventaris_$(date +%Y%m%d_%H%M%S).sql

# Hanya data (tanpa CREATE TABLE)
mysqldump -u <user> -p --no-create-info inventaris_db > data_only_$(date +%Y%m%d).sql

# Hanya struktur (tanpa data)
mysqldump -u <user> -p --no-data inventaris_db > schema_only.sql
```

### 6.2 Backup File Uploads (storage/)

File foto barang dan logo tersimpan di direktori `./storage/` (dikonfigurasi via `STORAGE_DIR` di `.env`). Backup direktori ini terpisah dari database:

```bash
# Kompres direktori storage
tar -czf storage_backup_$(date +%Y%m%d).tar.gz ./storage/

# Atau rsync ke lokasi lain
rsync -av ./storage/ /path/to/backup/storage/
```

### 6.3 Pemulihan

```bash
# Restore database dari dump
mysql -u <user> -p inventaris_db < backup_inventaris_YYYYMMDD_HHMMSS.sql

# Restore storage
tar -xzf storage_backup_YYYYMMDD.tar.gz -C ./
```

### 6.4 Jadwal Backup yang Direkomendasikan

| Frekuensi | Target | Retensi |
|---|---|---|
| Harian (malam) | mysqldump penuh | 7 hari |
| Mingguan | storage/ + mysqldump | 4 minggu |
| Bulanan | Full backup ke media offline | 12 bulan |

### 6.5 Otomatisasi dengan Cron (Linux/Server)

```bash
# Tambahkan ke crontab (crontab -e):
# Backup harian jam 02:00
0 2 * * * mysqldump -u inventaris_user -p'password' inventaris_db > /backup/db_$(date +\%Y\%m\%d).sql 2>/dev/null

# Hapus backup lebih dari 7 hari
0 3 * * * find /backup -name "db_*.sql" -mtime +7 -delete
```

> **Catatan:** Simpan kredensial MySQL di file `.my.cnf` (bukan plaintext di crontab) untuk keamanan. Verifikasi restore secara berkala dengan database test.

