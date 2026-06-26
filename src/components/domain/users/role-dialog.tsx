"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL } from "@/lib/nav-config";
import type { ManagedUser, Role } from "@/types/master";

const ROLE_OPTIONS: Role[] = ["PENGGUNA", "PJ_RUANG", "LABORAN", "INVENTARIS", "PIMPINAN"];

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  onSubmit: (role: Role) => Promise<void>;
  submitting?: boolean;
}

export function RoleDialog({ open, onOpenChange, user, onSubmit, submitting }: RoleDialogProps) {
  const [role, setRole] = useState<Role>("PENGGUNA");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && user) setRole(user.role);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role</DialogTitle>
          <DialogDescription>
            Ubah role untuk {user?.nama} ({user?.email}).
          </DialogDescription>
        </DialogHeader>

        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
            Batal
          </button>
          <button type="button" disabled={submitting} onClick={() => onSubmit(role)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4338CA] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
