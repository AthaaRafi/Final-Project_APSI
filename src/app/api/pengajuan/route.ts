import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { paginated } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { listPengajuanSchema } from "@/lib/validation/pengajuan";
import { getPengajuanList } from "@/server/services/pengajuan.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;

    const parsed = listPengajuanSchema.safeParse({
      page: searchParams.get("page") ?? "0",
      size: searchParams.get("size") ?? "20",
      jenis: searchParams.get("jenis") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      barangId: searchParams.get("barangId") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
    });

    if (!parsed.success) throw ApiError.badRequest("Parameter tidak valid");

    const { data, total } = await getPengajuanList(parsed.data, session);
    return paginated(data, parsed.data.page, parsed.data.size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}
