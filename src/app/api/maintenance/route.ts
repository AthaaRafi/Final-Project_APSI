import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok, created } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { createJadwalSchema } from "@/lib/validation/maintenance";
import { listJadwalMaintenance, createJadwal } from "@/server/repositories/maintenance.repo";
import { writeAuditLog } from "@/server/repositories/audit.repo";

export async function GET() {
  try {
    await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const data = await listJadwalMaintenance();
    return ok(data);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("INVENTARIS");
    const body = await request.json();
    const input = createJadwalSchema.parse(body);

    const jadwal = await createJadwal({
      jenisId: input.jenisId,
      intervalBulan: input.intervalBulan,
      createdBy: session.sub,
    });

    await writeAuditLog({
      aktor: session.sub,
      aksi: "CREATE",
      entitas: "JadwalMaintenance",
      entitasId: jadwal.id,
      detail: `Jadwal maintenance: interval ${input.intervalBulan} bulan`,
    });

    return created(jadwal);
  } catch (error) {
    return toProblemResponse(error);
  }
}
