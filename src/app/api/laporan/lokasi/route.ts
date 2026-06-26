import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { listLokasiBarang } from "@/server/repositories/laporan.repo";

export async function GET(request: NextRequest) {
  try {
    await requireRole("INVENTARIS", "PIMPINAN");
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "0");
    const size = Math.min(Number(searchParams.get("size") ?? "20"), 100);
    const search = searchParams.get("search") ?? undefined;
    const ruanganId = searchParams.get("ruanganId") ?? undefined;
    const jenisId = searchParams.get("jenisId") ?? undefined;

    const [data, total] = await listLokasiBarang(page, size, { search, ruanganId, jenisId });
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}
