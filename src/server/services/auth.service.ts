import { randomBytes, randomInt } from "crypto";
import { ApiError } from "@/lib/api/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { sendPasswordResetOtp, sendVerificationEmail } from "@/lib/mail";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SetupInput,
  VerifyEmailInput,
} from "@/lib/validation/auth";
import {
  activateUser,
  countRecentFailedAttempts,
  countUsers,
  createEmailVerificationToken,
  createPasswordResetOtp,
  createUser,
  findActivePasswordResetOtp,
  findEmailVerificationToken,
  findUserByEmail,
  markEmailVerificationTokenUsed,
  markPasswordResetOtpUsed,
  recordLoginAttempt,
  updateUserPassword,
} from "@/server/repositories/auth.repo";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "Email atau password salah";
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Terima email UNS apa pun: `@uns.ac.id` atau subdomain apa pun di bawahnya
 * (mis. `@student.uns.ac.id`, `@staff.uns.ac.id`, `@mhs.uns.ac.id`).
 * Deteksi berbasis domain agar tidak menerima string `uns.ac.id` di bagian lokal.
 */
export function isAllowedEmailDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1]?.trim();
  if (!domain) return false;
  return domain === "uns.ac.id" || domain.endsWith(".uns.ac.id");
}

export async function login(input: LoginInput, ipAddress?: string | null) {
  const { email, password, rememberMe } = input;

  if (!isAllowedEmailDomain(email)) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const lockoutSince = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const recentFailures = await countRecentFailedAttempts(email, lockoutSince);
  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    throw ApiError.unauthorized("Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit.");
  }

  const user = await findUserByEmail(email);
  const passwordValid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    await recordLoginAttempt(email, false, ipAddress);
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  if (user.status !== "ACTIVE") {
    await recordLoginAttempt(email, false, ipAddress);
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  await recordLoginAttempt(email, true, ipAddress);
  await createSession({ sub: user.id, role: user.role }, rememberMe);

  return user;
}

export async function register(input: RegisterInput) {
  const { nama, email, password } = input;

  if (!isAllowedEmailDomain(email)) {
    throw ApiError.badRequest("Hanya email kampus UNS yang diterima (domain uns.ac.id)");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw ApiError.conflict("Email sudah terdaftar");
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    nama,
    role: "PENGGUNA",
    status: "PENDING_VERIFICATION",
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await createEmailVerificationToken(user.id, token, expiresAt);
  await sendVerificationEmail(user.email, user.nama, token);

  return user;
}

export async function verifyEmail(input: VerifyEmailInput) {
  const { token } = input;

  const record = await findEmailVerificationToken(token);
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("Token verifikasi tidak valid atau sudah kedaluwarsa");
  }

  await activateUser(record.userId);
  await markEmailVerificationTokenUsed(record.id);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const { email } = input;

  const user = await findUserByEmail(email);
  if (user && user.status === "ACTIVE") {
    const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
    await createPasswordResetOtp(user.id, otp, expiresAt);
    await sendPasswordResetOtp(user.email, user.nama, otp);
  }
}

export async function resetPassword(input: ResetPasswordInput) {
  const { email, otp, password } = input;

  const user = await findUserByEmail(email);
  const record = user ? await findActivePasswordResetOtp(user.id, otp) : null;

  if (!user || !record) {
    throw ApiError.badRequest("OTP tidak valid atau sudah kedaluwarsa");
  }

  const passwordHash = await hashPassword(password);
  await updateUserPassword(user.id, passwordHash);
  await markPasswordResetOtpUsed(record.id);
}

export async function setupFirstInventaris(input: SetupInput) {
  const { nama, email, password } = input;

  const userCount = await countUsers();
  if (userCount > 0) {
    throw ApiError.forbidden("Setup hanya dapat dilakukan saat sistem belum memiliki akun");
  }

  if (!isAllowedEmailDomain(email)) {
    throw ApiError.badRequest("Hanya email kampus UNS yang diterima (domain uns.ac.id)");
  }

  const passwordHash = await hashPassword(password);
  return createUser({
    email,
    passwordHash,
    nama,
    role: "INVENTARIS",
    status: "ACTIVE",
  });
}
