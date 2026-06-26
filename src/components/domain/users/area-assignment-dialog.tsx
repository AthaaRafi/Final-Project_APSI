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
import type { ManagedUser, Ruangan } from "@/types/master";

interface AreaAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  ruanganList: Ruangan[];
  onSubmit: (ruanganIds: string[]) => Promise<void>;
  submitting?: boolean;
}

export function AreaAssignmentDialog({
  open,
  onOpenChange,
  user,
  ruanganList,
  onSubmit,
  submitting,
}: AreaAssignmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Penugasan Ruangan</DialogTitle>
          <DialogDescription>
            Pilih ruangan yang menjadi tanggung jawab {user?.nama}.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <AreaAssignmentForm
            key={user.id}
            user={user}
            ruanganList={ruanganList}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AreaAssignmentForm({
  user,
  ruanganList,
  onSubmit,
  onCancel,
  submitting,
}: {
  user: ManagedUser;
  ruanganList: Ruangan[];
  onSubmit: (ruanganIds: string[]) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(() => user.areas.map((area) => area.ruanganId));

  function toggle(ruanganId: string) {
    setSelected((prev) =>
      prev.includes(ruanganId) ? prev.filter((id) => id !== ruanganId) : [...prev, ruanganId],
    );
  }

  return (
    <>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {ruanganList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada ruangan terdaftar.</p>
        ) : (
          ruanganList.map((ruangan) => (
            <label
              key={ruangan.id}
              className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(ruangan.id)}
                onCheckedChange={() => toggle(ruangan.id)}
              />
              <span>
                {ruangan.kodeRuangan} - {ruangan.namaRuangan}
              </span>
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
