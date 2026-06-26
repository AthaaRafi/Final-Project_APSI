import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { assignUserRuanganSchema } from "@/lib/validation/user-management";
import { requireRole } from "@/lib/auth/rbac";
import { assignUserRuanganEntry } from "@/server/services/user-management.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = assignUserRuanganSchema.parse(body);

    const user = await assignUserRuanganEntry(id, input, session.sub);
    return ok(user);
  } catch (error) {
    return toProblemResponse(error);
  }
}
