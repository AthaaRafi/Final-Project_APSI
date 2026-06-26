import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { updateRuanganSchema } from "@/lib/validation/ruangan";
import { requireRole } from "@/lib/auth/rbac";
import { deleteRuanganEntry, updateRuanganEntry } from "@/server/services/ruangan.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = updateRuanganSchema.parse(body);

    const ruangan = await updateRuanganEntry(id, input, session.sub);
    return ok(ruangan);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    await deleteRuanganEntry(id, session.sub);
    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
