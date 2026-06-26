import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "inv_session";

const DEFAULT_EXPIRES_IN = "8h";
const REMEMBER_ME_EXPIRES_IN = "30d";
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;
const DEFAULT_MAX_AGE = 8 * 60 * 60;

export async function createSession(payload: SessionPayload, rememberMe = false): Promise<void> {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRES_IN : (process.env.JWT_EXPIRES_IN ?? DEFAULT_EXPIRES_IN);
  const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
  const token = await signSessionToken(payload, expiresIn);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
