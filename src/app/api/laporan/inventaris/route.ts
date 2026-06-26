import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { listLaporanInventaris } from "@/server/repositories/laporan.repo";
import type { Kondisi, StatusBarang } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireRole("INVENTARIS", "PIMPINAN");
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "0");
    const size = Math.min(Number(searchParams.get("size") ?? "20"), 100);

    const filter = {
      search: searchParams.get("search") ?? undefined,
      jenisId: searchParams.get("jenisId") ?? undefined,
      kondisi: (searchParams.get("kondisi") as Kondisi) ?? undefined,
      statusBarang: (searchParams.get("statusBarang") as StatusBarang) ?? undefined,
      ruanganId: searchParams.get("ruanganId") ?? undefined,
      flagVerifikasi: searchParams.get("flagVerifikasi") ?? undefined,
      tahunPembelianMin: searchParams.get("tahunMin")
        ? Number(searchParams.get("tahunMin"))
        : undefined,
      tahunPembelianMax: searchParams.get("tahunMax")
        ? Number(searchParams.get("tahunMax"))
        : undefined,
    };

    const [data, total] = await listLaporanInventaris(page, size, filter);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}
