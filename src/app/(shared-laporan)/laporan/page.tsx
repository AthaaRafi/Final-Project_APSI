import Link from "next/link";
import { FileText, MapPin, QrCode, Shield } from "lucide-react";

const LAPORAN_MENU = [
  {
    href: "/laporan/inventaris",
    icon: FileText,
    title: "Laporan Inventaris",
    desc: "Daftar lengkap barang dengan filter kondisi, status, lokasi, jenis, dan periode.",
  },
  {
    href: "/laporan/lokasi",
    icon: MapPin,
    title: "Laporan Lokasi Barang",
    desc: "Barang yang lokasi aktual berbeda dari lokasi terdaftar (real-time).",
  },
  {
    href: "/laporan/opname",
    icon: QrCode,
    title: "Laporan Hasil Stock Opname",
    desc: "Arsip hasil sesi scan per ruangan — ringkasan dan detail per sesi.",
  },
  {
    href: "/laporan/audit",
    icon: Shield,
    title: "Audit Trail",
    desc: "Jejak aktivitas penting: siapa, apa, dan kapan perubahan terjadi.",
  },
];

export default function LaporanIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Laporan & Export</h1>
        <p className="text-sm text-muted-foreground">Pilih jenis laporan yang ingin dilihat.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LAPORAN_MENU.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className="rounded-lg border p-5 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <Icon className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
