import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { tindakLanjutAnomaaliSchema } from "@/lib/validation/scan";
import { tindakLanjutAnomali } from "@/server/services/scan.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { id: opnameId } = await params;
    const body = await request.json();

    const parsed = tindakLanjutAnomaaliSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    // Pastikan detailId memang milik opname ini (security check)
    if (parsed.data.detailId && !opnameId) {
      throw ApiError.badRequest("opnameId wajib");
    }

    const result = await tindakLanjutAnomali(parsed.data, session.sub, session.role);
    return ok(result);
  } catch (error) {
    return toProblemResponse(error);
  }
}
