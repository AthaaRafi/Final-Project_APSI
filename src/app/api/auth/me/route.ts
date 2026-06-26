import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/rbac";
import { findUserById } from "@/server/repositories/auth.repo";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await findUserById(session.sub);
    if (!user) {
      throw ApiError.unauthorized();
    }

    return ok({
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return toProblemResponse(error);
  }
}
