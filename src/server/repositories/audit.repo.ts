import { db } from "@/lib/db";

export function writeAuditLog(data: {
  aktor: string;
  aksi: string;
  entitas: string;
  entitasId?: string;
  detail?: string;
}) {
  return db.auditLog.create({ data });
}
