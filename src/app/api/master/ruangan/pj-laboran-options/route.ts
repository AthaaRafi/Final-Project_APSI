import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { getPjLaboranOptions } from "@/server/services/ruangan.service";

export async function GET() {
  try {
    await requireRole("INVENTARIS");

    const users = await getPjLaboranOptions();
    return ok(users.map((u) => ({ id: u.id, nama: u.nama, email: u.email, role: u.role })));
  } catch (error) {
    return toProblemResponse(error);
  }
}
