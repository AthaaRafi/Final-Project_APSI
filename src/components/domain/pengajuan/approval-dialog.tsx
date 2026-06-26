"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { approvalActionSchema, type ApprovalActionInput } from "@/lib/validation/pengajuan";
import type { Pengajuan } from "@/types/master";
import { JENIS_PENGAJUAN_LABEL } from "@/lib/pengajuan-constants";

interface ApprovalDialogProps {
  pengajuan: Pengajuan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ApprovalActionInput) => Promise<void>;
  submitting?: boolean;
}

const AKSI_OPTIONS = [
  { value: "approve", label: "Setujui" },
  { value: "reject", label: "Tolak" },
  { value: "revisi", label: "Minta Revisi" },
] as const;

export function ApprovalDialog({
  pengajuan,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: ApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proses Pengajuan</DialogTitle>
        </DialogHeader>
        {open && (
          <ApprovalForm
            key={pengajuan.id}
            pengajuan={pengajuan}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApprovalForm({
  pengajuan,
  onSubmit,
  onCancel,
  submitting,
}: {
  pengajuan: Pengajuan;
  onSubmit: (data: ApprovalActionInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const form = useForm<ApprovalActionInput>({
    resolver: zodResolver(approvalActionSchema),
    defaultValues: { aksi: "approve", catatan: "" },
  });

  const aksi = form.watch("aksi");
  const needsCatatan = aksi === "reject" || aksi === "revisi";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm space-y-1">
          <p className="text-xs text-muted-foreground">{pengajuan.nomor}</p>
          <p className="font-medium">{JENIS_PENGAJUAN_LABEL[pengajuan.jenis]}</p>
          <p className="text-xs">
            Barang:{" "}
            <span className="font-mono">{pengajuan.barang.kodeBarang}</span>{" "}
            {pengajuan.barang.namaBarang}
          </p>
          {pengajuan.isAntarArea && (
            <p className="text-xs text-amber-600 font-medium">Dual-approval (antar area)</p>
          )}
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Alasan pengaju: </span>
          {pengajuan.alasan}
        </div>

        <FormField
          control={form.control}
          name="aksi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keputusan</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AKSI_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="catatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Catatan{needsCatatan ? <span className="text-destructive"> *</span> : " (opsional)"}
              </FormLabel>
              <FormControl>
                <Input placeholder="Catatan untuk pengaju" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 dark:bg-card">
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 ${aksi === "approve" ? "bg-primary" : "bg-red-600 hover:bg-red-700"}`}
          >
            {submitting ? "Memproses..." : "Simpan"}
          </button>
        </DialogFooter>
      </form>
    </Form>
  );
}
