import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { assignPenanggungJawabSchema } from "@/lib/validation/ruangan";
import { requireRole } from "@/lib/auth/rbac";
import { assignPenanggungJawabEntry } from "@/server/services/ruangan.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;

    const body = await req.json();
    const input = assignPenanggungJawabSchema.parse(body);

    const ruangan = await assignPenanggungJawabEntry(id, input, session.sub);
    return ok(ruangan);
  } catch (error) {
    return toProblemResponse(error);
  }
}
