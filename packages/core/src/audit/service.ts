import type { Database, Transaction } from '@rwos/db';
import { schema } from '@rwos/db';
import { type AuditEntry, auditEntrySchema } from './schema';

/**
 * Writes one audit_log row. Call it inside the same transaction as the change it records,
 * so the change and its audit entry are saved together or not at all.
 * The table is append-only: entries can never be edited or deleted.
 */
export async function recordAudit(db: Database | Transaction, entry: AuditEntry): Promise<void> {
  const parsed = auditEntrySchema.parse(entry);
  await db.insert(schema.auditLog).values({
    actorUserId: parsed.actorUserId,
    action: parsed.action,
    subjectType: parsed.subjectType ?? null,
    subjectId: parsed.subjectId ?? null,
    before: parsed.before ?? null,
    after: parsed.after ?? null,
    ip: parsed.ip ?? null,
    userAgent: parsed.userAgent ?? null,
  });
}
