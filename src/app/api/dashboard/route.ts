import { requireAuth } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import {
  getStatsGlobal,
  getStatsArea,
  getStatsPengguna,
} from "@/server/repositories/dashboard.repo";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role === "INVENTARIS" || session.role === "PIMPINAN") {
      const stats = await getStatsGlobal();
      return ok(stats);
    }

    if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
      const ruanganIds = await getUserScopeRuanganIds(session.sub);
      const stats = await getStatsArea(ruanganIds);
      return ok(stats);
    }

    // PENGGUNA
    const stats = await getStatsPengguna(session.sub);
    return ok(stats);
  } catch (error) {
    return toProblemResponse(error);
  }
}
