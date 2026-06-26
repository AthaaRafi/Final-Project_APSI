import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { created } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { createLogCetak } from "@/server/repositories/label.repo";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");

    const body = await request.json() as { ruanganId?: unknown; jumlahLabel?: unknown };
    const ruanganId = typeof body.ruanganId === "string" ? body.ruanganId : null;
    const jumlahLabel = typeof body.jumlahLabel === "number" ? body.jumlahLabel : null;

    if (!ruanganId || !jumlahLabel) {
      throw ApiError.badRequest("ruanganId dan jumlahLabel wajib diisi");
    }

    const log = await createLogCetak({
      ruanganId,
      adminId: session.sub,
      jumlahLabel,
      status: "SELESAI",
    });

    return created(log);
  } catch (error) {
    return toProblemResponse(error);
  }
}
