import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { markNotifikasiRead } from "@/server/repositories/dashboard.repo";

// PATCH /api/notifikasi/[id] — tandai satu notifikasi dibaca
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await markNotifikasiRead(id, session.sub);
    return ok({ ok: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
