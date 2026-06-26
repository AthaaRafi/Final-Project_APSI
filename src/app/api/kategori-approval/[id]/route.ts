import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { updateKategoriApprovalSchema } from "@/lib/validation/kategori-approval";
import { requireRole } from "@/lib/auth/rbac";
import { deleteKategoriApprovalEntry, updateKategoriApprovalEntry } from "@/server/services/kategori-approval.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = updateKategoriApprovalSchema.parse(body);

    const kategori = await updateKategoriApprovalEntry(id, input, session.sub);
    return ok(kategori);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    await deleteKategoriApprovalEntry(id, session.sub);
    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
