import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { updateJadwalSchema } from "@/lib/validation/maintenance";
import { findJadwalById, updateJadwal, deleteJadwal } from "@/server/repositories/maintenance.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const existing = await findJadwalById(id);
    if (!existing) throw ApiError.notFound("Jadwal tidak ditemukan");

    const body = await request.json();
    const input = updateJadwalSchema.parse(body);

    const jadwal = await updateJadwal(id, { intervalBulan: input.intervalBulan });

    await writeAuditLog({
      aktor: session.sub,
      aksi: "UPDATE",
      entitas: "JadwalMaintenance",
      entitasId: id,
      detail: `Interval diubah ke ${input.intervalBulan} bulan`,
    });

    return ok(jadwal);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const existing = await findJadwalById(id);
    if (!existing) throw ApiError.notFound("Jadwal tidak ditemukan");

    await deleteJadwal(id);

    await writeAuditLog({
      aktor: session.sub,
      aksi: "DELETE",
      entitas: "JadwalMaintenance",
      entitasId: id,
    });

    return ok({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    return toProblemResponse(error);
  }
}
