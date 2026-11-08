import { z } from 'zod';

/** Dotted, lower-case action names, for example `auth.sign_in` or `price.update`. */
export const auditActionSchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, {
  message: 'Use a dotted lower-case action name, for example auth.sign_in',
});

const snapshot = z.record(z.string(), z.unknown()).nullable().optional();

export const auditEntrySchema = z.object({
  /** Null when the system itself acted. */
  actorUserId: z.uuid().nullable(),
  action: auditActionSchema,
  subjectType: z.string().min(1).max(64).nullable().optional(),
  subjectId: z.uuid().nullable().optional(),
  /** State before and after the change, for money, permissions, KYC, prices and compliance rules. */
  before: snapshot,
  after: snapshot,
  ip: z.string().max(64).nullable().optional(),
  /** Long user agents are cut to 512 characters rather than rejected. */
  userAgent: z
    .string()
    .nullable()
    .optional()
    .transform((value) => (value ? value.slice(0, 512) : value)),
});

export type AuditEntry = z.input<typeof auditEntrySchema>;
