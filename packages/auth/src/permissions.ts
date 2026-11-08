import { isPermission, type Permission } from '@rwos/core';
import { type Database, schema } from '@rwos/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { Auth } from './create-auth';
import { getStaffSession, type StaffSessionResult } from './sessions';

/** Why access was refused; the admin turns each into the right screen. */
export class AuthorizationError extends Error {
  constructor(
    readonly reason: 'signed_out' | 'two_factor_setup_required' | 'forbidden',
    readonly permission?: Permission,
  ) {
    super(
      reason === 'forbidden'
        ? `You do not have permission to do this (${permission}).`
        : reason === 'two_factor_setup_required'
          ? 'Set up two-factor authentication to continue.'
          : 'Please sign in.',
    );
    this.name = 'AuthorizationError';
  }
}

/** The permissions of an active, not-deleted staff member, read from their role. Empty for anyone else. */
export async function loadStaffPermissions(
  db: Database,
  userId: string,
): Promise<ReadonlySet<Permission>> {
  const rows = await db
    .select({ key: schema.permissions.key })
    .from(schema.staffMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.staffMembers.userId))
    .innerJoin(
      schema.rolePermissions,
      eq(schema.rolePermissions.roleId, schema.staffMembers.roleId),
    )
    .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
    .where(
      and(
        eq(schema.staffMembers.userId, userId),
        eq(schema.staffMembers.active, true),
        eq(schema.users.isStaff, true),
        isNull(schema.users.deletedAt),
      ),
    );
  return new Set(rows.map((row) => row.key).filter(isPermission));
}

/** Whether the permission set includes every one of `required`. For hiding controls; never a substitute for authorize(). */
export function can(permissions: ReadonlySet<Permission>, ...required: Permission[]): boolean {
  return required.every((permission) => permissions.has(permission));
}

export type AuthorizedStaff = Extract<StaffSessionResult, { status: 'active' }> & {
  permissions: ReadonlySet<Permission>;
};

/**
 * The gate for every admin server action and route: a fully signed-in staff member (two-factor
 * done) whose role holds every `required` permission. Throws AuthorizationError otherwise.
 * Code checks permission keys, never role names (SECURITY.md).
 */
export async function authorize(
  auth: Auth,
  db: Database,
  headers: Headers,
  ...required: [Permission, ...Permission[]]
): Promise<AuthorizedStaff> {
  const session = await getStaffSession(auth, db, headers);
  if (session.status !== 'active') throw new AuthorizationError(session.status);
  const permissions = await loadStaffPermissions(db, session.user.id);
  const missing = required.find((permission) => !permissions.has(permission));
  if (missing) throw new AuthorizationError('forbidden', missing);
  return { ...session, permissions };
}
