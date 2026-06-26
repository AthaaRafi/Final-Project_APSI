import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { updateUserRoleSchema } from "@/lib/validation/user-management";
import { requireRole } from "@/lib/auth/rbac";
import { updateUserRoleEntry } from "@/server/services/user-management.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = updateUserRoleSchema.parse(body);

    const { user, areaWarning } = await updateUserRoleEntry(id, input, session.sub);
    return ok({ user, areaWarning });
  } catch (error) {
    return toProblemResponse(error);
  }
}
