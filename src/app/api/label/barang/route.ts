import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { getBarangForLabel } from "@/server/repositories/label.repo";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { searchParams } = request.nextUrl;
    const ruanganId = searchParams.get("ruanganId");

    if (!ruanganId) throw ApiError.badRequest("ruanganId wajib diisi");

    // Scope check: PJ/Laboran hanya bisa cetak label ruangan mereka sendiri
    if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
      const scopeIds = await getUserScopeRuanganIds(session.sub);
      if (!scopeIds.includes(ruanganId)) {
        throw ApiError.forbidden("Anda tidak memiliki akses ke ruangan ini");
      }
    }

    const barangList = await getBarangForLabel(ruanganId);
    return ok(barangList);
  } catch (error) {
    return toProblemResponse(error);
  }
}
