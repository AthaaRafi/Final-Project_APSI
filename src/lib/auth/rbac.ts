import type { Role } from "@prisma/client";
import { ApiError } from "@/lib/api/errors";
import { clearSession, getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";
import { findUserById } from "@/server/repositories/auth.repo";

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw ApiError.unauthorized();
  }

  const user = await findUserById(session.sub);
  if (!user || user.status !== "ACTIVE") {
    await clearSession();
    throw ApiError.unauthorized();
  }

  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw ApiError.forbidden();
  }
  return session;
}
