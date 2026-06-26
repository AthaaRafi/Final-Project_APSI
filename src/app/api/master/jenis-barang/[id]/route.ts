import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { updateJenisBarangSchema } from "@/lib/validation/jenis-barang";
import { requireRole } from "@/lib/auth/rbac";
import { deleteJenisBarangEntry, updateJenisBarangEntry } from "@/server/services/jenis-barang.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = updateJenisBarangSchema.parse(body);

    const jenisBarang = await updateJenisBarangEntry(id, input, session.sub);
    return ok(jenisBarang);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    await deleteJenisBarangEntry(id, session.sub);
    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
