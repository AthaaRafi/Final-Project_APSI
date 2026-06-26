import type { Role, StatusUser } from "@prisma/client";
import { db } from "@/lib/db";

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

export function countUsers() {
  return db.user.count();
}

export function createUser(data: {
  email: string;
  passwordHash: string;
  nama: string;
  role: Role;
  status: StatusUser;
}) {
  return db.user.create({ data });
}

export function activateUser(id: string) {
  return db.user.update({ where: { id }, data: { status: "ACTIVE", emailVerifiedAt: new Date() } });
}

export function updateUserPassword(id: string, passwordHash: string) {
  return db.user.update({ where: { id }, data: { passwordHash } });
}

export function recordLoginAttempt(email: string, success: boolean, ipAddress?: string | null) {
  return db.loginAttempt.create({
    data: { email, success, ipAddress: ipAddress ?? undefined },
  });
}

export function countRecentFailedAttempts(email: string, since: Date) {
  return db.loginAttempt.count({
    where: { email, success: false, attemptedAt: { gte: since } },
  });
}

export function createEmailVerificationToken(userId: string, token: string, expiresAt: Date) {
  return db.emailVerificationToken.create({ data: { userId, token, expiresAt } });
}

export function findEmailVerificationToken(token: string) {
  return db.emailVerificationToken.findUnique({ where: { token } });
}

export function markEmailVerificationTokenUsed(id: string) {
  return db.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export function createPasswordResetOtp(userId: string, otp: string, expiresAt: Date) {
  return db.passwordResetOtp.create({ data: { userId, otp, expiresAt } });
}

export function findActivePasswordResetOtp(userId: string, otp: string) {
  return db.passwordResetOtp.findFirst({
    where: { userId, otp, usedAt: null, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export function markPasswordResetOtpUsed(id: string) {
  return db.passwordResetOtp.update({ where: { id }, data: { usedAt: new Date() } });
}
