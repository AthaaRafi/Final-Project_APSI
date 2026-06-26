import Link from "next/link";
import {
  Settings,
  Building2,
  Users,
  Box,
  Tags,
  QrCode,
  Printer,
  CheckCircle2,
} from "lucide-react";

interface Step {
  no: number;
  icon: React.ElementType;
  judul: string;
  deskripsi: string;
  link?: { label: string; href: string };
  kp?: string;
}

const STEPS: Step[] = [
  {
    no: 1,
    icon: Settings,
    judul: "Setup akun Inventaris",
    deskripsi:
      "Akun Inventaris pertama dibuat melalui halaman /setup saat database masih kosong. Akun berikutnya dibuat oleh Inventaris aktif melalui Akun & Role.",
    link: { label: "Kelola Akun & Role", href: "/users" },
    kp: "KP-01",
  },
  {
    no: 2,
    icon: Building2,
    judul: "Input data gedung & ruangan",
    deskripsi:
      "Daftarkan semua gedung dan ruangan fakultas. Kode ruangan akan dipakai dalam kode barang dan payload QR.",
    link: { label: "Master Data", href: "/master" },
    kp: "KP-03 / KP-04",
  },
  {
    no: 3,
    icon: Tags,
    judul: "Buat jenis barang & kategori approval",
    deskripsi:
      "Jenis barang menentukan prefix kode barang (misal: MEJA, KURSI). Kategori approval menentukan apakah pemindahan butuh persetujuan atau langsung tercatat.",
    link: { label: "Kategori Approval", href: "/kategori-approval" },
    kp: "KP-05 / KP-07",
  },
  {
    no: 4,
    icon: Users,
    judul: "Assign PJ Ruang & Laboran ke ruangan",
    deskripsi:
      "Buat akun untuk PJ Ruang dan Laboran, lalu assign mereka ke ruangan yang menjadi tanggung jawabnya. Akun baru mendaftar sendiri (email UNS), lalu Inventaris mengubah role dan assign area.",
    link: { label: "Kelola Akun & Role", href: "/users" },
    kp: "KP-06",
  },
  {
    no: 5,
    icon: Box,
    judul: "Input data barang",
    deskripsi:
      "Tambahkan barang satu per satu melalui halaman Data Barang. Kode barang di-generate otomatis jika dikosongkan. Setiap barang akan mendapat QR code digital.",
    link: { label: "Data Barang", href: "/barang" },
    kp: "KP-08 / KP-09",
  },
  {
    no: 6,
    icon: Printer,
    judul: "Upload logo & cetak label",
    deskripsi:
      "Upload logo instansi di Konfigurasi Label, lalu PJ Ruang/Laboran bisa cetak label QR fisik per ruangan dan tempel ke barang.",
    link: { label: "Konfigurasi Label", href: "/konfigurasi-label" },
    kp: "KP-21 / KP-24",
  },
  {
    no: 7,
    icon: QrCode,
    judul: "Jalankan Stock Opname pertama",
    deskripsi:
      "PJ Ruang atau Laboran membuka sesi Scan Cepat, memindai setiap barang di ruangan, lalu menutup sesi. Hasilnya menjadi arsip permanen verifikasi pertama.",
    link: { label: "Scan Cepat", href: "/scan" },
    kp: "KP-14 / KP-15",
  },
];

export default function PanduanPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Panduan Setup Awal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ikuti langkah berikut secara urut untuk mempersiapkan sistem inventaris sebelum dipakai
          operasional (KP-25).
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.no}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">#{step.no}</span>
                  <h3 className="font-medium text-sm">{step.judul}</h3>
                  {step.kp && (
                    <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-mono">
                      {step.kp}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{step.deskripsi}</p>
                {step.link && (
                  <Link
                    href={step.link.href}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    <CheckCircle2 className="size-3" />
                    {step.link.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-800 dark:text-green-200">
        <strong>Setelah semua langkah selesai:</strong> sistem siap digunakan operasional. PJ Ruang
        dan Laboran dapat mulai melakukan scan, approval, dan laporan kerusakan. Inventaris dapat
        memantau laporan dan mengekspor data untuk universitas secara manual.
      </div>
    </div>
  );
}
