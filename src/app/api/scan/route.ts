import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { mulaiSesiServerSchema } from "@/lib/validation/scan";
import { mulaiSesi } from "@/server/services/scan.service";
import { listSesi } from "@/server/repositories/scan.repo";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "0");
    const size = Math.min(Number(searchParams.get("size") ?? "20"), 100);

    let ruanganIds: string[] = [];
    if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
      ruanganIds = await getUserScopeRuanganIds(session.sub);
    }

    const [data, total] = await listSesi(session.sub, ruanganIds, page, size);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const body = await request.json();
    const parsed = mulaiSesiServerSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }
    const sesi = await mulaiSesi(parsed.data, session.sub, session.role);
    return created(sesi);
  } catch (error) {
    return toProblemResponse(error);
  }
}
