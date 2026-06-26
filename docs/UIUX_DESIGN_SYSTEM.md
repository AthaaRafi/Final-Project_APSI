# UIUX_DESIGN_SYSTEM

<aside>
✨

**UIUX_DESIGN_SYSTEM — Bahasa Visual & Design System** · v1.0 · 18 Juni 2026
Dokumen ini adalah **fondasi visual premium** untuk Sistem Inventaris Barang Fakultas: warna, tipografi, spasi, gerak/motion, dan komponen. Tujuannya satu — bikin produk terasa **profesional, modern, interaktif, dan nyaman di mata**.

Hubungan dengan dokumen lain: `UIUX_FLOW.md` mengatur **alur & layar** (apa yang tampil), dokumen ini mengatur **rasa & estetika** (bagaimana tampilannya). **Warna status kanonik di `UIUX_FLOW.md` §3 tetap berlaku** dan hanya diterjemahkan ke token yang lebih presisi di sini.

</aside>

## 1. Filosofi Desain — "Calm, Confident, Crafted"

Tiga kata kunci yang memandu setiap keputusan:

- **Calm (Menenangkan).** Latar lembut (bukan putih menyilaukan), kontras terukur, banyak ruang napas. Mata tidak lelah walau dipakai berjam-jam mengelola ratusan barang.
- **Confident (Meyakinkan).** Hierarki jelas, tipografi tegas, satu warna brand yang konsisten. Pengguna langsung tahu *apa yang penting* dan *aksi apa berikutnya*.
- **Crafted (Digarap rapi).** Sudut membulat halus, bayangan berlapis lembut, dan **micro-interaction** yang responsif. Detail inilah yang memunculkan kesan *"wow, bagus banget"*.

> Prinsip operasional dari `UIUX_FLOW.md` (data-first, padat informasi, Bahasa Indonesia, mobile-first untuk Scan Cepat) tetap dipegang. Design system ini membuat yang *padat* tetap terasa *lega* dan *premium*.
> 

### Aturan emas

1. **Warna brand untuk aksi & navigasi**; **warna semantik hanya untuk status** (badge). Jangan tertukar.
2. **Jangan mengandalkan warna saja** — setiap status selalu punya **ikon + label teks**.
3. **Konsistensi token** > kreativitas dadakan. Ambil dari token di dokumen ini, jangan hardcode hex acak.
4. **Setiap aksi punya feedback** (hover, loading, sukses, error) dalam < 200 ms.

---

## 2. Fondasi Warna

Filosofi warna: **biru indigo** sebagai warna brand (akademik, tepercaya, modern) di atas **netral slate** yang sejuk. Latar memakai *off-white* hangat-dingin, bukan `#FFFFFF` murni, agar **ramah di mata** dan mengurangi silau.

### 2.1 Brand — Akademik Indigo (aksi utama, navigasi aktif, link, focus ring)

| Token | Hex | Pemakaian |
| --- | --- | --- |
| primary-50 | `#EEF2FF` | latar lembut, hover item nav |
| primary-100 | `#E0E7FF` | chip/aktif background tipis |
| primary-200 | `#C7D2FE` | border aktif, ring lembut |
| primary-300 | `#A5B4FC` | aksen sekunder |
| primary-400 | `#818CF8` | gradient stop terang |
| **primary-500** | `#6366F1` | aksen / hover tombol |
| **primary-600** | `#4F46E5` | **warna aksi utama (tombol, link)** |
| primary-700 | `#4338CA` | tombol ditekan / active |
| primary-800 | `#3730A3` | teks brand di latar terang |
| primary-900 | `#312E81` | heading aksen pekat |

<aside>
🌈

**Gradient signature** (untuk hero login, kartu statistik, header dashboard): `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` (Indigo → Violet). Pakai **tipis & terukur** — jangan di seluruh halaman.

</aside>

### 2.2 Netral — Slate (teks, latar, border, permukaan)

| Token | Hex | Light mode | Dark mode |
| --- | --- | --- | --- |
| slate-50 | `#F8FAFC` | **latar aplikasi** | teks utama |
| slate-100 | `#F1F5F9` | latar hover/zebra | — |
| slate-200 | `#E2E8F0` | **border default** | teks sekunder |
| slate-400 | `#94A3B8` | teks placeholder | teks sekunder |
| slate-500 | `#64748B` | **teks sekunder** | teks muted |
| slate-700 | `#334155` | teks kuat | border |
| slate-800 | `#1E293B` | — | **permukaan/kartu** |
| slate-900 | `#0F172A` | **teks utama** | — |
| slate-950 | `#020617` | — | **latar aplikasi** |

**Permukaan & latar (eye-comfort):**

| Peran | Light | Dark |
| --- | --- | --- |
| Latar aplikasi (canvas) | `#F8FAFC` | `#0B1220` |
| Permukaan / Card | `#FFFFFF` | `#0F172A` |
| Permukaan terangkat (modal/popover) | `#FFFFFF`  • shadow | `#111A2E` |
| Border halus | `#E2E8F0` | `#1E293B` |
| Teks utama | `#0F172A` | `#E2E8F0` |
| Teks sekunder | `#64748B` | `#94A3B8` |

> **Kenapa bukan putih murni?** `#F8FAFC` di canvas + kartu putih menciptakan kedalaman halus tanpa silau. Teks `#0F172A` (bukan `#000000`) menurunkan kontras ekstrem yang bikin mata cepat lelah.
> 

### 2.3 Warna Semantik Status (terjemahan KANONIK `UIUX_FLOW.md` §3)

Setiap badge memakai pola **soft**: latar tint + teks pekat + border tipis. Selalu sertakan **ikon**.

| Makna (domain §3) | Keluarga | Solid | Badge BG | Badge Teks | Badge Border |
| --- | --- | --- | --- | --- | --- |
| Hijau — Normal / Baik / Cocok / Disetujui / Terverifikasi | Emerald | `#10B981` | `#ECFDF5` | `#047857` | `#A7F3D0` |
| Oranye — Dilaporkan Rusak / Revisi | Orange | `#F97316` | `#FFF7ED` | `#C2410C` | `#FED7AA` |
| Kuning — Menunggu / Rusak Ringan / Tidak Cocok | Amber | `#F59E0B` | `#FFFBEB` | `#B45309` | `#FDE68A` |
| Biru — Dalam Perawatan | Blue | `#3B82F6` | `#EFF6FF` | `#1D4ED8` | `#BFDBFE` |
| Ungu — Terjadwal Perawatan | Violet | `#8B5CF6` | `#F5F3FF` | `#6D28D9` | `#DDD6FE` |
| Merah — Hilang / Rusak Berat / Ditolak / Tidak Terdaftar / Anomali | Red | `#EF4444` | `#FEF2F2` | `#B91C1C` | `#FECACA` |
| Abu-abu — Diajukan Hapus / Nonaktif / Dibatalkan / Belum | Slate | `#64748B` | `#F1F5F9` | `#475569` | `#E2E8F0` |

<aside>
♿

Semua kombinasi teks-di-atas-badge sudah dirancang lolos **WCAG AA (≥ 4.5:1)**. Karena ~8% pria mengalami buta warna, **ikon + label wajib** menyertai warna (mis. ✓ Cocok, ⚠ Tidak Cocok, ✗ Tidak Terdaftar).

</aside>

---

## 3. Tipografi — "Memanjakan Mata"

Pasangan dua font yang modern, profesional, dan sangat terbaca:

| Peran | Font | Alasan |
| --- | --- | --- |
| **Display & Heading** | **Plus Jakarta Sans** | Geometris-humanis, modern, berkarakter. Bonus: dirancang di Indonesia — selaras konteks UNS. Bobot 600/700/800. |
| **Body & UI** | **Inter** | Legibilitas juara untuk teks kecil & tabel padat. Fitur `tabular-nums` rapi untuk angka. Bobot 400/500/600. |
| **Mono** | **JetBrains Mono** | Untuk `kode_barang`, ID, payload QR. Membedakan `0/O` dan `1/l/I` dengan jelas. |

### 3.1 Skala Tipografi (base 16px)

| Token | Ukuran | Line-height | Bobot | Tracking | Contoh |
| --- | --- | --- | --- | --- | --- |
| Display | `clamp(2rem, 4vw, 2.5rem)` | 1.15 | 800 | -0.02em | Judul hero login |
| H1 | 2rem (32px) | 1.2 | 700 | -0.02em | Judul halaman |
| H2 | 1.5rem (24px) | 1.25 | 700 | -0.01em | Judul seksi |
| H3 | 1.25rem (20px) | 1.3 | 600 | -0.01em | Judul kartu |
| Body-L | 1.0625rem (17px) | 1.6 | 400 | 0 | Paragraf utama |
| **Body** | 0.9375rem (15px) | 1.55 | 400 | 0 | **default UI** |
| Small | 0.8125rem (13px) | 1.5 | 500 | 0 | Label, meta |
| Caption | 0.75rem (12px) | 1.4 | 500 | 0.01em | Helper, footnote |
| Mono | 0.875rem (14px) | 1.4 | 500 | 0 | Kode barang |

**Aturan:** heading pakai tracking negatif (lebih *tight* = lebih modern & mahal). Body line-height longgar (1.5–1.6) demi kenyamanan baca. Angka pada tabel/dashboard pakai `font-variant-numeric: tabular-nums`.

### 3.2 Setup font (`next/font`)

```tsx
// app/fonts.ts
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google"

export const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
})
export const fontSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
})
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
})
// app/layout.tsx -> <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
```

---

## 4. Spasi, Grid & Layout

- **Basis spasi 4px** (skala Tailwind: 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px). Konsisten kelipatan 4.
- **Ritme vertikal:** jarak antar-seksi `32px`, antar-kartu `16–24px`, padding kartu `20–24px`.
- **Lebar konten maksimum:** `1280px` (dashboard tabel boleh full-width dengan padding `32px`).
- **Shell:** Sidebar `264px` (collapse → `72px` ikon-only), Topbar tinggi `64px`, sticky.
- **Grid dashboard:** 12 kolom; kartu statistik `span 3` (desktop) → `span 6` (tablet) → `span 12` (mobile).
- **Gutter mobile:** `16px`. **Tap target minimum `44×44px`** (krusial untuk Scan Cepat satu tangan).

---

## 5. Radius, Border & Elevation

### Radius (membulat halus = ramah & modern)

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--radius-sm` | 8px | badge, chip, input kecil |
| `--radius` | 12px | **tombol, input, dropdown** |
| `--radius-lg` | 16px | **kartu, modal, popover** |
| `--radius-xl` | 24px | panel hero, sheet mobile |
| full | 9999px | avatar, pill, badge status |

### Border

- Default `1px` `#E2E8F0` (light) / `#1E293B` (dark). Hindari border tebal; pisahkan elemen dengan **spasi & elevation**, bukan garis tebal.

### Elevation (bayangan berlapis lembut, ber-tint slate)

```css
--shadow-xs: 0 1px 2px 0 rgb(15 23 42 / 0.04);
--shadow-sm: 0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06);
--shadow-md: 0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06);
--shadow-lg: 0 12px 28px -6px rgb(15 23 42 / 0.12), 0 4px 10px -4px rgb(15 23 42 / 0.08);
```

> **Dark mode:** kurangi opacity bayangan, andalkan **border + perbedaan permukaan** untuk kedalaman.
> 

---

## 6. Motion & Micro-interaction — "Tidak Kaku"

Inilah lapisan yang bikin produk terasa hidup. **Pakai `framer-motion` + `tailwindcss-animate`.**

### 6.1 Token gerak

| Token | Durasi | Easing | Untuk |
| --- | --- | --- | --- |
| fast | 120ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | hover, tekan tombol |
| base | 180ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | dropdown, toggle |
| slow | 240ms | `cubic-bezier(0.16, 1, 0.3, 1)` | modal, drawer |
| page | 320ms | `cubic-bezier(0.16, 1, 0.3, 1)` | transisi halaman |

### 6.2 Pola interaksi wajib

- **Tombol:** hover naik warna + `scale(1.0)`, ditekan `scale(0.98)`, transisi `fast`.
- **Kartu:** hover `translateY(-2px)` + naik ke `--shadow-md`.
- **Nav aktif:** indikator geser mulus antar menu (`framer-motion layoutId`).
- **Transisi halaman:** fade + slide-up `8px` (`page`).
- **List/tabel:** masuk *stagger* 30ms per baris (maksimal 10 baris pertama).
- **Skeleton shimmer** saat loading tabel/detail (bukan spinner kosong).
- **Angka dashboard:** *count-up* animasi saat kartu statistik muncul.
- **Toast (sonner):** slide-in dari kanan-atas + auto-dismiss.
- **ScanFeedback (Scan Cepat):** banner besar **pulse + ring** hijau/kuning/merah + **getar (Vibration API)** + suara opsional. Inilah momen "wow" operasional.
- **Modal:** fade + scale `0.96 → 1`.

```tsx
// Transisi halaman (template.tsx)
"use client"
import { motion } from "framer-motion"
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial= opacity: 0, y: 8 
      animate= opacity: 1, y: 0 
      transition= duration: 0.32, ease: [0.16, 1, 0.3, 1] 
    >
      {children}
    </motion.div>
  )
}
```

<aside>
🧏

**Aksesibilitas gerak:** hormati `prefers-reduced-motion`. Bila aktif, **nonaktifkan transform/parallax**, sisakan fade halus saja. Jangan pernah mengorbankan kegunaan demi animasi.

</aside>

---

## 7. Spesifikasi Komponen Kunci

| Komponen | Spesifikasi ringkas |
| --- | --- |
| **Button (primary)** | bg `#4F46E5`, teks putih, radius 12, padding `10px 16px`, bobot 600, hover `#4338CA`, focus ring 2px `#A5B4FC`. Varian: `secondary` (slate outline), `ghost`, `destructive` (red), `icon`. |
| **Input/Select** | tinggi 40px, border `#E2E8F0`, radius 12, focus border `#6366F1`  • ring lembut. Label di atas, helper/error di bawah (teks, bukan hanya warna). |
| **Card** | bg permukaan, radius 16, padding 24, `--shadow-sm`; hover `--shadow-md` bila interaktif. Header: H3 + ikon `lucide` opsional. |
| **StatusBadge / KondisiBadge / MatchingBadge** | pill radius-full, pola *soft* (§2.3), `ikon + label`, tinggi 24px, teks Small 500. |
| **DataTable** | header sticky, zebra `#F8FAFC`, baris hover `#F1F5F9`, tinggi baris 48px, angka `tabular-nums`. Toolbar: search + filter chip. Paginasi server (cap 100). Skeleton saat loading, `EmptyState` saat kosong. |
| **Sidebar** | latar permukaan, item radius 12, aktif: bg `#EEF2FF`  • teks `#4338CA`  • indikator kiri 3px brand. Section label Caption uppercase muted. |
| **Topbar** | sticky, latar permukaan + `backdrop-blur` tipis, judul halaman (H2/H3), lonceng notifikasi (badge merah angka), menu akun (avatar). |
| **Modal/Dialog** | overlay `rgb(15 23 42 / 0.45)`  • blur 2px, panel radius-lg, `--shadow-lg`, animasi scale. `ConfirmDialog` untuk aksi destruktif. |
| **Toast** | sonner, ikon semantik, radius 12, `--shadow-md`. Sukses hijau, error merah, info brand. |
| **EmptyState** | ilustrasi/ikon `lucide` besar muted, judul + 1 kalimat + tombol aksi utama. |

---

## 8. Layar Signature (upgrade dari "jadul" → "wow")

- **Login / Auth** — layout **split**: kiri panel brand dengan **gradient signature** + tagline + poin nilai ("Inventaris fakultas, akurat & real-time"); kanan form bersih berkartu. Kesan pertama premium.
- **Dashboard** — baris **kartu statistik** dengan ikon dalam lingkaran tint + angka *count-up* + tren mini. Di bawahnya: antrian tugas (approval/laporan) sebagai daftar ringkas, bukan tabel padat.
- **Detail Barang (FU-04)** — header besar: nama + `kode_barang` (mono) + `StatusBadge` + `KondisiBadge`; QR ditampilkan dalam kartu rapi; **Tab** Info / Timeline dengan komponen `Timeline` vertikal beraksen brand.
- **Scan Cepat (FA-12, mobile)** — tombol **"Mulai Scan Cepat"** besar bergradient (mirip QRIS); viewport kamera dengan bingkai animasi; **ScanFeedback** full-width hijau/kuning/merah + counter berjalan. Bottom sheet (`vaul`) untuk ringkasan & tindak lanjut batch.

---

## 9. Dark Mode

- Wajib didukung (toggle di menu akun, tersimpan di `localStorage` + `class="dark"`).
- Canvas `#0B1220`, permukaan `#0F172A`, border `#1E293B`, teks `#E2E8F0`.
- Badge semantik beralih ke versi *tint transparan*, mis. `background: rgb(16 185 129 / 0.15); color: #6EE7B7`.
- Brand sedikit dinaikkan keterangannya (`#6366F1`) agar kontras di latar gelap.

---

## 10. Aksesibilitas (non-negotiable)

- **Kontras** teks ≥ 4.5:1; elemen UI/ikon ≥ 3:1.
- **Focus-visible** selalu terlihat: ring 2px brand + offset 2px. Jangan dihilangkan.
- **Tap target ≥ 44px**, terutama alur Scan Cepat.
- **Jangan andalkan warna saja** — status = warna + ikon + label.
- Navigasi **keyboard** penuh; komponen shadcn/Radix sudah ber-ARIA, pertahankan.
- Error form: pesan teks Bahasa Indonesia per-field (dari envelope RFC 7807), bukan sekadar border merah.

---

## 11. Implementasi Teknis

### 11.1 Dependensi tambahan

```bash
npm i framer-motion vaul
# tailwindcss-animate & sonner sudah ada (lihat ENVIRONMENT.md)
```

### 11.2 CSS Variables (`app/globals.css`) — konvensi shadcn (HSL)

```css
:root {
  --background: 210 40% 98%;      /* #F8FAFC */
  --foreground: 222 47% 11%;      /* #0F172A */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 243 75% 59%;         /* #4F46E5 */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;/* #64748B */
  --border: 214 32% 91%;          /* #E2E8F0 */
  --ring: 239 84% 67%;            /* #6366F1 */
  --radius: 0.75rem;              /* 12px */
}
.dark {
  --background: 222 64% 8%;       /* #0B1220 */
  --foreground: 213 31% 91%;      /* #E2E8F0 */
  --card: 222 47% 11%;            /* #0F172A */
  --primary: 239 84% 67%;         /* #6366F1 */
  --muted-foreground: 215 20% 65%;/* #94A3B8 */
  --border: 217 33% 17%;          /* #1E293B */
}
```

### 11.3 `tailwind.config.ts` (ekstensi token)

```tsx
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "1rem", md: "calc(var(--radius))", sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        sm: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        md: "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06)",
        lg: "0 12px 28px -6px rgb(15 23 42 / 0.12), 0 4px 10px -4px rgb(15 23 42 / 0.08)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-up": "fade-up 0.32s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 12. Do & Don't

| ✅ Do | ❌ Don't |
| --- | --- |
| Latar `#F8FAFC`  • kartu putih | Lembar `#FFFFFF` penuh yang menyilaukan |
| Brand indigo untuk aksi & nav | Brand indigo dipakai jadi badge status |
| Status = warna + ikon + label | Hanya titik warna tanpa teks |
| Bayangan lembut berlapis | Border tebal & bayangan keras `#000` |
| Animasi 120–320ms, halus | Animasi > 500ms / berlebihan / bouncy norak |
| `tabular-nums` di tabel/dashboard | Angka goyang lebarnya saat berubah |
| Hormati `prefers-reduced-motion` | Memaksa animasi ke semua pengguna |

---

## 13. Checklist Adopsi

- [ ]  Font `Plus Jakarta Sans` + `Inter` + `JetBrains Mono` terpasang via `next/font`.
- [ ]  CSS variables & `tailwind.config` token masuk.
- [ ]  `framer-motion` + `vaul` terpasang; transisi halaman & nav aktif jalan.
- [ ]  `StatusBadge`/`KondisiBadge`/`MatchingBadge` memetakan warna §2.3 + ikon.
- [ ]  Dark mode + toggle berfungsi & persisten.
- [ ]  Skeleton loading di tabel & detail; `EmptyState` di list kosong.
- [ ]  Audit kontras WCAG AA & focus-visible di semua komponen.
- [ ]  Tap target ≥ 44px diverifikasi di Scan Cepat (mobile).

---

## 14. Arah Visual Referensi — "Modern SaaS Dashboard"

<aside>
🎯

**Penting:** kalau aplikasi masih terlihat "kuno", itu karena design system ini **belum diimplementasikan di kode** — yang tampil adalah shadcn mentah tanpa token. Target rasa yang dituju: **dashboard SaaS modern** (sidebar berwarna penuh, header gradient, kartu statistik dengan sparkline, badge pill). **Warna status tetap kanonik (§2.3).**

</aside>

### 14.1 Sidebar Terisi (Filled) — pengubah suasana utama

- Latar **solid/gradient brand** (`#4F46E5` → `#4338CA`), teks putih ~90%.
- Item: ikon + label, radius 12, padding `12px 14px`.
- **Aktif:** kartu putih (`#FFFFFF`) + teks brand `#4338CA` + `--shadow-sm` (pill menonjol seperti referensi).
- Hover: `rgb(255 255 255 / 0.10)`. Logo di atas (64px), avatar/Logout di bawah. Lebar 264px.

### 14.2 Header / Topbar

- Opsi A: **bar gradient signature** full-width berisi judul + 1 metrik ringkas.
- Opsi B: putih bersih + judul (H2) + lonceng + avatar + nama. Pilih salah satu konsisten.

### 14.3 StatCard (kartu statistik) — sumber kesan "wow"

Pola tiap kartu: **[ikon dalam lingkaran tint]** + label kecil muted + **angka besar** (H1/Display, `tabular-nums`) + **delta** (↑12% hijau / ↓ merah) + **sparkline mini**.

- Card radius 16–20, padding 20–24, `--shadow-sm`, hover `--shadow-md` + `translateY(-2px)`.
- Sparkline: `recharts` area/line, tinggi 40–56px, tanpa axis, warna ikut metrik (hijau/kuning/oranye).

### 14.4 Badge Pill Status (di tabel)

- `rounded-full`, soft tint (§2.3) + **dot/ikon** + teks Small 600. Contoh: Aktif (hijau), Menunggu Verifikasi (kuning), Nonaktif (abu).

### 14.5 Tabel Modern (ganti gaya "garis kotak")

- **Buang border kotak penuh.** Header bg `#F8FAFC`, antar-baris cukup border bawah tipis, hover `#F1F5F9`, tinggi baris 56px.
- Kolom Nama: **avatar inisial** + nama. Kolom Status: **badge pill**. Kolom Role: badge soft. Aksi: tombol ikon di kanan.

### 14.6 Spasi & Bentuk Lebih Lega

- Padding konten `32px`, gap antar-kartu `20–24px`, radius kartu `16–20px`, perbanyak whitespace (jangan padat-mepet seperti tampilan lama).

### 14.7 Dependensi tambahan

```bash
npm i recharts        # sparkline & chart dashboard
npx shadcn@latest add avatar
```

### 14.8 Before → After (contoh: halaman Akun & Role)

| Aspek | Before (sekarang) | After (target) |
| --- | --- | --- |
| Sidebar | Putih polos, teks hitam | Indigo terisi, item aktif pill putih |
| Header | Garis tipis + teks | Bersih/gradient + avatar |
| Atas tabel | Langsung tabel | 3 StatCard ringkas (Total akun · Aktif · Menunggu verifikasi) + sparkline |
| Tabel | Garis kotak penuh | Borderless, avatar inisial, role badge, status pill, aksi ikon |
| Rasa | Admin template lama | SaaS modern, lega, berwarna |