import Link from "next/link";
import { Building2, DoorOpen, Tags } from "lucide-react";

const MASTER_MENU = [
  {
    href: "/master/gedung",
    label: "Gedung",
    description: "Kelola data gedung di lingkungan fakultas.",
    icon: Building2,
  },
  {
    href: "/master/ruangan",
    label: "Ruangan",
    description: "Kelola ruangan, tipe, lantai, dan penanggung jawab.",
    icon: DoorOpen,
  },
  {
    href: "/master/jenis-barang",
    label: "Jenis Barang",
    description: "Kelola jenis barang untuk penyusunan kode barang.",
    icon: Tags,
  },
];

export default function MasterDataPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Master Data</h1>
        <p className="text-sm text-muted-foreground">
          Data dasar yang menjadi prasyarat pendataan barang.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MASTER_MENU.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <Icon className="size-5 text-primary" />
              <div className="text-sm font-medium">{item.label}</div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
