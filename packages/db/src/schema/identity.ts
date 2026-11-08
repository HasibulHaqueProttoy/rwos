import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { id, oneOfCheck, softDelete, timestamps, utcTimestamp } from '../columns';

/*
 * Identity and access (docs/DATA_MODEL.md). The first six tables are the ones Better Auth
 * reads and writes; their TypeScript keys must match Better Auth's field names exactly.
 */

export const sessionAudiences = ['admin', 'customer'] as const;
export type SessionAudience = (typeof sessionAudiences)[number];

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text().notNull().default(''),
    email: text().notNull(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    phone: text(),
    /** IANA time zone (for example Asia/Dhaka) for showing dates; null means the browser's. */
    timezone: text(),
    /** Set only by staff provisioning, never by sign-up (Better Auth input: false). */
    isStaff: boolean().notNull().default(false),
    twoFactorEnabled: boolean().notNull().default(false),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    uniqueIndex('users_email_key').on(table.email),
    check('users_email_lowercase_check', sql`${table.email} = lower(${table.email})`),
    index('users_is_staff_idx').on(table.isStaff),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    token: text().notNull(),
    expiresAt: utcTimestamp().notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Which app the session belongs to; an admin session never works in the customer app and the reverse. */
    audience: text().notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('sessions_token_key').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
    oneOfCheck('sessions_audience_check', table.audience, sessionAudiences),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: utcTimestamp(),
    refreshTokenExpiresAt: utcTimestamp(),
    scope: text(),
    /** Unused: no passwords (customers and staff sign in with an emailed code). */
    password: text(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('accounts_provider_id_account_id_key').on(table.providerId, table.accountId),
    index('accounts_user_id_idx').on(table.userId),
  ],
);

export const verifications = pgTable(
  'verifications',
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: utcTimestamp().notNull(),
    ...timestamps(),
  },
  (table) => [
    index('verifications_identifier_idx').on(table.identifier),
    index('verifications_expires_at_idx').on(table.expiresAt),
  ],
);

export const twoFactors = pgTable(
  'two_factors',
  {
    id: id(),
    /** TOTP secret, encrypted by Better Auth with AUTH_SECRET. */
    secret: text().notNull(),
    /** Backup codes, encrypted by Better Auth. */
    backupCodes: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verified: boolean().notNull().default(true),
    failedVerificationCount: integer().notNull().default(0),
    lockedUntil: utcTimestamp(),
    ...timestamps(),
  },
  (table) => [uniqueIndex('two_factors_user_id_key').on(table.userId)],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    id: id(),
    key: text().notNull(),
    count: integer().notNull(),
    /** Milliseconds since 1970 (Better Auth's format). */
    lastRequest: bigint({ mode: 'number' }).notNull(),
    ...timestamps(),
  },
  (table) => [uniqueIndex('rate_limits_key_key').on(table.key)],
);

/** Roles are configuration (seeded in task 1.7, edited in the admin); code checks permissions, never role keys. */
export const roles = pgTable(
  'roles',
  {
    id: id(),
    key: text().notNull(),
    name: text().notNull(),
    description: text(),
    ...timestamps(),
  },
  (table) => [uniqueIndex('roles_key_key').on(table.key)],
);

export const permissions = pgTable(
  'permissions',
  {
    id: id(),
    /** For example `ledger.read` or `refund.approve`. */
    key: text().notNull(),
    description: text().notNull(),
    ...timestamps(),
  },
  (table) => [uniqueIndex('permissions_key_key').on(table.key)],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: id(),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid()
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('role_permissions_role_id_permission_id_key').on(table.roleId, table.permissionId),
    index('role_permissions_permission_id_idx').on(table.permissionId),
  ],
);

export const staffMembers = pgTable(
  'staff_members',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    /** For partner users: the partner they work for. The foreign key to partners arrives with that table (Milestone 2). */
    partnerId: uuid(),
    active: boolean().notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('staff_members_user_id_key').on(table.userId),
    index('staff_members_role_id_idx').on(table.roleId),
    index('staff_members_partner_id_idx').on(table.partnerId),
  ],
);

export const approvalActions = ['refund', 'discount', 'price_change', 'payout_recipient'] as const;
export const approvalStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;

export const approvalRules = pgTable(
  'approval_rules',
  {
    id: id(),
    action: text().notNull(),
    /** When the rule applies, for example a discount above a percentage. Shape defined with each action. */
    condition: jsonb().notNull().default({}),
    approverRoleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    active: boolean().notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index('approval_rules_approver_role_id_idx').on(table.approverRoleId),
    index('approval_rules_action_idx').on(table.action),
    oneOfCheck('approval_rules_action_check', table.action, approvalActions),
  ],
);

export const approvals = pgTable(
  'approvals',
  {
    id: id(),
    ruleId: uuid()
      .notNull()
      .references(() => approvalRules.id, { onDelete: 'restrict' }),
    subjectType: text().notNull(),
    subjectId: uuid().notNull(),
    requestedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    decidedBy: uuid().references(() => users.id, { onDelete: 'restrict' }),
    status: text().notNull().default('pending'),
    reason: text(),
    decidedAt: utcTimestamp(),
    ...timestamps(),
  },
  (table) => [
    index('approvals_rule_id_idx').on(table.ruleId),
    index('approvals_requested_by_idx').on(table.requestedBy),
    index('approvals_decided_by_idx').on(table.decidedBy),
    index('approvals_subject_idx').on(table.subjectType, table.subjectId),
    index('approvals_status_idx').on(table.status),
    oneOfCheck('approvals_status_check', table.status, approvalStatuses),
    // A second person must decide (PRD: approvals need a second person).
    check(
      'approvals_second_person_check',
      sql`${table.decidedBy} is null or ${table.decidedBy} <> ${table.requestedBy}`,
    ),
    // A decided approval records who decided and when; a pending one has neither.
    check(
      'approvals_decision_check',
      sql`(${table.status} in ('approved', 'rejected')) = (${table.decidedBy} is not null and ${table.decidedAt} is not null)`,
    ),
  ],
);

/** Append-only (a trigger rejects UPDATE, DELETE and TRUNCATE). Written through the audit service in @rwos/core. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    /** Null for actions taken by the system itself. */
    actorUserId: uuid().references(() => users.id, { onDelete: 'restrict' }),
    /** Dotted name, for example `auth.sign_in` or `price.update`. */
    action: text().notNull(),
    subjectType: text(),
    subjectId: uuid(),
    before: jsonb(),
    after: jsonb(),
    ip: text(),
    userAgent: text(),
    ...timestamps(),
  },
  (table) => [
    index('audit_log_actor_user_id_idx').on(table.actorUserId),
    index('audit_log_subject_idx').on(table.subjectType, table.subjectId),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
);
