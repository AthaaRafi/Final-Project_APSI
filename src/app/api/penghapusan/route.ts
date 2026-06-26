import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { listPenghapusanByTahun, getTahunPenghapusan } from "@/server/repositories/laporan.repo";

export async function GET(request: NextRequest) {
  try {
    await requireRole("INVENTARIS");
    const { searchParams } = request.nextUrl;
    const tahunParam = searchParams.get("tahun");
    const tahun = tahunParam ? Number(tahunParam) : undefined;

    const [data, tahunList] = await Promise.all([
      listPenghapusanByTahun(tahun),
      getTahunPenghapusan(),
    ]);

    return ok({ data, tahunList });
  } catch (error) {
    return toProblemResponse(error);
  }
}
