import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { batalkanPengajuanEntry } from "@/server/services/pengajuan.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await batalkanPengajuanEntry(id, session.sub);
    return ok(result);
  } catch (error) {
    return toProblemResponse(error);
  }
}
