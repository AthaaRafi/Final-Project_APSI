import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { updateGedungSchema } from "@/lib/validation/gedung";
import { requireRole } from "@/lib/auth/rbac";
import { deleteGedungEntry, updateGedungEntry } from "@/server/services/gedung.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = updateGedungSchema.parse(body);

    const gedung = await updateGedungEntry(id, input, session.sub);
    return ok(gedung);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    await deleteGedungEntry(id, session.sub);
    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
