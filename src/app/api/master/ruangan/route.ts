import { created, paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { createRuanganSchema } from "@/lib/validation/ruangan";
import { requireRole } from "@/lib/auth/rbac";
import { createRuanganEntry, getRuanganList } from "@/server/services/ruangan.service";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

export async function GET(req: Request) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");

    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const size = Math.min(200, Math.max(1, Number(url.searchParams.get("size") ?? 20)));

    let scopeRuanganIds: string[] | undefined;
    if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
      scopeRuanganIds = await getUserScopeRuanganIds(session.sub);
    }

    const { data, total } = await getRuanganList(page, size, scopeRuanganIds);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("INVENTARIS");

    const body = await req.json();
    const input = createRuanganSchema.parse(body);

    const ruangan = await createRuanganEntry(input, session.sub);
    return created(ruangan);
  } catch (error) {
    return toProblemResponse(error);
  }
}
