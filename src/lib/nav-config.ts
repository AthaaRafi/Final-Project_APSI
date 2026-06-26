import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Box,
  ClipboardList,
  Download,
  History,
  LayoutDashboard,
  QrCode,
  Send,
  Settings,
  Tag,
  Tags,
  Printer,
  Users,
  Wrench,
  FileText,
  Calendar,
  Eye,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  PENGGUNA: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pelapor/barang", label: "Barang", icon: Box },
    { href: "/pelapor/pengajuan", label: "Pengajuan Saya", icon: ClipboardList },
    { href: "/lapor", label: "Lapor", icon: Send },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  PJ_RUANG: [
    { href: "/area", label: "Dashboard Area", icon: LayoutDashboard },
    { href: "/area/barang", label: "Barang Area", icon: Box },
    { href: "/area/approval", label: "Approval", icon: ClipboardList },
    { href: "/scan", label: "Scan Cepat", icon: QrCode },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/area/label", label: "Cetak Label", icon: Printer },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  LABORAN: [
    { href: "/area", label: "Dashboard Area", icon: LayoutDashboard },
    { href: "/area/barang", label: "Barang Area", icon: Box },
    { href: "/area/approval", label: "Approval", icon: ClipboardList },
    { href: "/scan", label: "Scan Cepat", icon: QrCode },
    { href: "/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/area/label", label: "Cetak Label", icon: Printer },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  INVENTARIS: [
    { href: "/inventaris", label: "Dashboard Global", icon: LayoutDashboard },
    { href: "/barang", label: "Data Barang", icon: Box },
    { href: "/inventaris/pengajuan", label: "Pengajuan", icon: ClipboardList },
    { href: "/master", label: "Master Data", icon: Settings },
    { href: "/kategori-approval", label: "Kategori Approval", icon: Tags },
    { href: "/users", label: "Akun & Role", icon: Users },
    { href: "/laporan", label: "Laporan", icon: FileText },
    { href: "/penghapusan", label: "Histori Penghapusan", icon: History },
    { href: "/maintenance", label: "Jadwal Maintenance", icon: Calendar },
    { href: "/konfigurasi-label", label: "Konfigurasi Label", icon: Tag },
    { href: "/export", label: "Export Data", icon: Download },
    { href: "/panduan", label: "Panduan Setup", icon: BookOpen },
    { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  PIMPINAN: [
    { href: "/supervisor", label: "Dashboard Pemantauan", icon: LayoutDashboard },
    { href: "/laporan", label: "Laporan", icon: Eye },
    { href: "/lapor", label: "Lapor", icon: Send },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  PENGGUNA: "Pengguna",
  PJ_RUANG: "PJ Ruang",
  LABORAN: "Laboran",
  INVENTARIS: "Inventaris",
  PIMPINAN: "Pimpinan",
};
