import { db, auditLog } from "@polokaz/db";

export interface AuditLogData {
  adminId: string;
  adminRole: string;
  targetUserId: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason: string;
  notes?: string | null;
  ipAddress?: string | null;
}

export async function logAdminAction(data: AuditLogData) {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      adminId: data.adminId,
      adminRole: data.adminRole,
      targetUserId: data.targetUserId,
      action: data.action,
      previousStatus: data.previousStatus || null,
      newStatus: data.newStatus || null,
      reason: data.reason,
      notes: data.notes || null,
      ipAddress: data.ipAddress || null,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
