import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { selesaikanSesiSchema } from "@/lib/validation/scan";
import { selesaikanSesi } from "@/server/services/scan.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = selesaikanSesiSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }
    const result = await selesaikanSesi(id, parsed.data, session.sub, session.role);
    return ok(result);
  } catch (error) {
    return toProblemResponse(error);
  }
}
