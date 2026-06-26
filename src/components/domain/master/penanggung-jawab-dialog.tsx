"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROLE_LABEL } from "@/lib/nav-config";
import type { PjLaboranOption, Ruangan } from "@/types/master";

interface PenanggungJawabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruangan: Ruangan | null;
  options: PjLaboranOption[];
  onSubmit: (userIds: string[]) => Promise<void>;
  submitting?: boolean;
}

export function PenanggungJawabDialog({
  open,
  onOpenChange,
  ruangan,
  options,
  onSubmit,
  submitting,
}: PenanggungJawabDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Penanggung Jawab Ruangan</DialogTitle>
          <DialogDescription>
            Pilih PJ Ruang/Laboran untuk ruangan {ruangan?.namaRuangan}.
          </DialogDescription>
        </DialogHeader>

        {ruangan && (
          <PenanggungJawabForm
            key={ruangan.id}
            ruangan={ruangan}
            options={options}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PenanggungJawabForm({
  ruangan,
  options,
  onSubmit,
  onCancel,
  submitting,
}: {
  ruangan: Ruangan;
  options: PjLaboranOption[];
  onSubmit: (userIds: string[]) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    ruangan.penanggungJawab.map((pj) => pj.userId),
  );

  function toggle(userId: string) {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  return (
    <>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada akun PJ Ruang/Laboran aktif.</p>
        ) : (
          options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(option.id)}
                onCheckedChange={() => toggle(option.id)}
              />
              <div className="flex flex-col">
                <span className="font-medium">{option.nama}</span>
                <span className="text-xs text-muted-foreground">
                  {option.email} - {ROLE_LABEL[option.role as keyof typeof ROLE_LABEL]}
                </span>
              </div>
            </label>
          ))
        )}
      </div>

      <DialogFooter>
        <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
          Batal
        </button>
        <button type="button" disabled={submitting} onClick={() => onSubmit(selected)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
          {submitting ? "Menyimpan..." : "Simpan"}
        </button>
      </DialogFooter>
    </>
  );
}
