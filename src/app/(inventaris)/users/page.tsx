"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Shield, UserCog, UserX, Users as UsersIcon, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/domain/confirm-dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { StatCard } from "@/components/domain/dashboard/stat-card";
import { RoleDialog } from "@/components/domain/users/role-dialog";
import { AreaAssignmentDialog } from "@/components/domain/users/area-assignment-dialog";
import { apiClient, ApiClientError, fetchPaginated } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { ROLE_LABEL } from "@/lib/nav-config";
import type { ManagedUser, Role, Ruangan, StatusUser } from "@/types/master";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<StatusUser, string> = {
  PENDING_VERIFICATION: "Menunggu Verifikasi",
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
};

const STATUS_STYLE: Record<StatusUser, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

const ROLE_STYLE: Record<Role, string> = {
  INVENTARIS: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  PJ_RUANG: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  LABORAN: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  PENGGUNA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  PIMPINAN: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
};

const AREA_ROLES: Role[] = ["PJ_RUANG", "LABORAN"];

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [roleTarget, setRoleTarget] = useState<ManagedUser | null>(null);
  const [areaTarget, setAreaTarget] = useState<ManagedUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ user: ManagedUser; next: StatusUser } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list(page, PAGE_SIZE),
    queryFn: () => fetchPaginated<ManagedUser>(`/users?page=${page}&size=${PAGE_SIZE}`),
  });

  const { data: ruanganData } = useQuery({
    queryKey: queryKeys.master.ruangan(0, 100),
    queryFn: () => fetchPaginated<Ruangan>(`/master/ruangan?page=0&size=100`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  function handleAreaWarning(areaWarning?: string) {
    if (areaWarning) toast.warning(areaWarning);
  }

  async function handleRoleSubmit(role: Role) {
    if (!roleTarget) return;
    setSubmitting(true);
    try {
      const res = await apiClient.put<{ data: { areaWarning?: string } }>(`/users/${roleTarget.id}/role`, { role });
      toast.success("Role berhasil diubah");
      handleAreaWarning(res.data.areaWarning);
      setRoleTarget(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      const res = await apiClient.put<{ data: { areaWarning?: string } }>(`/users/${statusTarget.user.id}/status`, { status: statusTarget.next });
      toast.success(statusTarget.next === "ACTIVE" ? "Akun berhasil diaktifkan" : "Akun berhasil dinonaktifkan");
      handleAreaWarning(res.data.areaWarning);
      setStatusTarget(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAreaSubmit(ruanganIds: string[]) {
    if (!areaTarget) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/users/${areaTarget.id}/ruangan`, { ruanganIds });
      toast.success("Penugasan ruangan berhasil diperbarui");
      setAreaTarget(null);
      invalidate();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  const allUsers = data?.data ?? [];
  const totalAkun = data?.total ?? 0;
  const aktifCount = allUsers.filter(u => u.status === "ACTIVE").length;
  const pendingCount = allUsers.filter(u => u.status === "PENDING_VERIFICATION").length;

  const columns: ColumnDef<ManagedUser>[] = [
    {
      accessorKey: "nama",
      header: "Nama",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(row.original.nama)}
          </div>
          <div>
            <p className="text-sm font-medium">{row.original.nama}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[row.original.role]}`}>
          {ROLE_LABEL[row.original.role]}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
            <span className={`size-1.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-500" : status === "PENDING_VERIFICATION" ? "bg-amber-500" : "bg-slate-400"}`} />
            {STATUS_LABEL[status]}
          </span>
        );
      },
    },
    {
      id: "areas",
      header: "Ruangan",
      cell: ({ row }) =>
        row.original.areas.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.areas.map((area) => (
              <Badge key={area.id} variant="outline" className="text-xs font-normal">
                {area.ruangan.kodeRuangan}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setRoleTarget(user)} title="Ubah role">
              <Shield className="size-3.5" />
            </Button>
            {AREA_ROLES.includes(user.role) && (
              <Button variant="ghost" size="icon-sm" onClick={() => setAreaTarget(user)} title="Penugasan ruangan">
                <MapPin className="size-3.5" />
              </Button>
            )}
            {user.status === "ACTIVE" ? (
              <Button variant="ghost" size="icon-sm" onClick={() => setStatusTarget({ user, next: "INACTIVE" })} title="Nonaktifkan">
                <UserX className="size-3.5" />
              </Button>
            ) : user.status === "INACTIVE" ? (
              <Button variant="ghost" size="icon-sm" onClick={() => setStatusTarget({ user, next: "ACTIVE" })} title="Aktifkan">
                <UserCog className="size-3.5" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Akun & Role</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola role, status, dan penugasan ruangan seluruh akun.</p>
      </div>

      {/* Stat cards (§14.8) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Akun" value={totalAkun} icon={UsersIcon} />
        <StatCard label="Aktif" value={aktifCount} icon={UserCheck} variant="success" />
        <StatCard label="Menunggu Verifikasi" value={pendingCount} icon={Clock} variant={pendingCount > 0 ? "warning" : "default"} />
      </div>

      {!isLoading && allUsers.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Belum ada akun" description="Akun baru akan muncul setelah pengguna mendaftar." />
      ) : (
        <DataTable
          columns={columns}
          data={allUsers}
          page={page}
          size={PAGE_SIZE}
          total={totalAkun}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      <RoleDialog open={!!roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)} user={roleTarget} onSubmit={handleRoleSubmit} submitting={submitting} />
      <AreaAssignmentDialog open={!!areaTarget} onOpenChange={(open) => !open && setAreaTarget(null)} user={areaTarget} ruanganList={ruanganData?.data ?? []} onSubmit={handleAreaSubmit} submitting={submitting} />
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget?.next === "ACTIVE" ? "Aktifkan akun?" : "Nonaktifkan akun?"}
        description={statusTarget?.next === "ACTIVE" ? `Akun "${statusTarget?.user.nama}" akan diaktifkan kembali.` : `Akun "${statusTarget?.user.nama}" akan dinonaktifkan dan tidak bisa login.`}
        confirmLabel={statusTarget?.next === "ACTIVE" ? "Aktifkan" : "Nonaktifkan"}
        variant={statusTarget?.next === "ACTIVE" ? "default" : "destructive"}
        loading={submitting}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
