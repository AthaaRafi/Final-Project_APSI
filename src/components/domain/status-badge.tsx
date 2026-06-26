import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench,
  Calendar,
  Search,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Kondisi, StatusBarang } from "@/types/master";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_CONFIG: Record<StatusBarang, StatusConfig> = {
  NORMAL: {
    label: "Normal",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  },
  DILAPORKAN_RUSAK: {
    label: "Dilaporkan Rusak",
    icon: AlertTriangle,
    className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  },
  MENUNGGU_VALIDASI: {
    label: "Menunggu Validasi",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  DALAM_PERAWATAN: {
    label: "Dalam Perawatan",
    icon: Wrench,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  TERJADWAL_PERAWATAN: {
    label: "Terjadwal Perawatan",
    icon: Calendar,
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  },
  HILANG: {
    label: "Hilang",
    icon: Search,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
  DIAJUKAN_HAPUS: {
    label: "Diajukan Hapus",
    icon: Trash2,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
  NONAKTIF: {
    label: "Nonaktif",
    icon: XCircle,
    className: "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  },
};

const KONDISI_CONFIG: Record<Kondisi, StatusConfig> = {
  BAIK: {
    label: "Baik",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  },
  RUSAK_RINGAN: {
    label: "Rusak Ringan",
    icon: AlertTriangle,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  RUSAK_BERAT: {
    label: "Rusak Berat",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
};

export function StatusBarangBadge({ status }: { status: StatusBarang }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

export function KondisiBadge({ kondisi }: { kondisi: Kondisi }) {
  const config = KONDISI_CONFIG[kondisi];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}
