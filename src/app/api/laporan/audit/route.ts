import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { listAuditLog } from "@/server/repositories/laporan.repo";

export async function GET(request: NextRequest) {
  try {
    await requireRole("INVENTARIS", "PIMPINAN");
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "0");
    const size = Math.min(Number(searchParams.get("size") ?? "30"), 100);
    const entitas = searchParams.get("entitas") ?? undefined;
    const aktor = searchParams.get("aktor") ?? undefined;

    const [data, total] = await listAuditLog(page, size, { entitas, aktor });
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}
