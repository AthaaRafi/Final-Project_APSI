import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { approvalActionSchema } from "@/lib/validation/pengajuan";
import { approvalPengajuanEntry } from "@/server/services/pengajuan.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { id } = await params;
    const body = await request.json();

    const parsed = approvalActionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    const result = await approvalPengajuanEntry(id, parsed.data, session.sub, session.role);
    return ok(result);
  } catch (error) {
    return toProblemResponse(error);
  }
}
