"use client";

import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/hooks/use-count-up";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

const VARIANT_CLASSES: Record<NonNullable<StatCardProps["variant"]>, { card: string; icon: string; iconBg: string }> = {
  default: {
    card: "border-border bg-card",
    icon: "text-primary",
    iconBg: "bg-primary/10",
  },
  warning: {
    card: "border-amber-200 bg-card dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  danger: {
    card: "border-red-200 bg-card dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/40",
  },
  success: {
    card: "border-emerald-200 bg-card dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
};

function AnimatedValue({ value }: { value: number | string }) {
  const numeric = typeof value === "number" ? value : 0;
  const animated = useCountUp(numeric);
  if (typeof value === "string") return <>{value}</>;
  return <>{animated}</>;
}

export function StatCard({ label, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  const v = VARIANT_CLASSES[variant];

  return (
    <div className={cn("rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5", v.card)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            <AnimatedValue value={value} />
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", v.iconBg)}>
          <Icon className={cn("size-5", v.icon)} />
        </div>
      </div>
    </div>
  );
}
