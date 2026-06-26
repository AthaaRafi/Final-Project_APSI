import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { getSesiDetail } from "@/server/services/scan.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { id } = await params;
    const { baseline } = await getSesiDetail(id, session.sub, session.role);
    return ok(baseline);
  } catch (error) {
    return toProblemResponse(error);
  }
}
