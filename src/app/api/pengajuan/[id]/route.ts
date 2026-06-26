import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { getPengajuanDetail } from "@/server/services/pengajuan.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const pengajuan = await getPengajuanDetail(id);
    return ok(pengajuan);
  } catch (error) {
    return toProblemResponse(error);
  }
}
