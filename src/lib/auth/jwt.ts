import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@prisma/client";

export interface SessionPayload {
  sub: string;
  role: Role;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tidak ditemukan di environment");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
  expiresIn: string = process.env.JWT_EXPIRES_IN ?? "8h",
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());

  if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Token tidak valid: payload tidak lengkap");
  }

  return { sub: payload.sub, role: payload.role as Role };
}
