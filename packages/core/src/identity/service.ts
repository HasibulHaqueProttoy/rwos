import { type Database, schema, type Transaction } from '@rwos/db';
import { and, eq } from 'drizzle-orm';
import { recordAudit } from '../audit/service';
import { IdentityError } from './errors';
import {
  type Actor,
  createStaffInput,
  type CreateStaffInput,
  setRolePermissionInput,
  setStaffActiveInput,
  setStaffRoleInput,
} from './schema';

/*
 * Staff and role management. Each function changes data and writes its audit entry in one
 * transaction. Callers check permission first (staff.manage or roles.manage, through
 * authorize() in @rwos/auth); command-line tools act as the system.
 */

/** Permissions the founder role can never lose, so nobody can lock everyone out of the admin. */
const FOUNDER_KEEPS = ['staff.manage', 'roles.manage'] as const;

async function findRole(tx: Transaction, roleKey: string) {
  const [role] = await tx
    .select({ id: schema.roles.id, key: schema.roles.key })
    .from(schema.roles)
    .where(eq(schema.roles.key, roleKey));
  if (!role) throw new IdentityError('role_not_found', `There is no role "${roleKey}".`);
  return role;
}

function audit(actor: Actor) {
  return { actorUserId: actor.userId, ip: actor.ip ?? null, userAgent: actor.userAgent ?? null };
}

/** Creates a staff account. The person then signs in at the admin with an emailed code and sets up two-factor. */
export async function createStaffMember(db: Database, actor: Actor, input: CreateStaffInput) {
  const data = createStaffInput.parse(input);
  return db.transaction(async (tx) => {
    const role = await findRole(tx, data.roleKey);
    const [existing] = await tx
      .select({ id: schema.users.id, isStaff: schema.users.isStaff })
      .from(schema.users)
      .where(eq(schema.users.email, data.email));
    if (existing?.isStaff) {
      throw new IdentityError('already_staff', 'This email already has a staff account.');
    }
    if (existing) {
      throw new IdentityError(
        'email_in_use_by_customer',
        'This email belongs to a customer account. Use a separate work email for the staff account.',
      );
    }

    const [user] = await tx
      .insert(schema.users)
      .values({ email: data.email, name: data.name, isStaff: true })
      .returning({ id: schema.users.id });
    if (!user) throw new Error('User insert returned nothing');
    const [staff] = await tx
      .insert(schema.staffMembers)
      .values({ userId: user.id, roleId: role.id, partnerId: data.partnerId ?? null })
      .returning({ id: schema.staffMembers.id });
    if (!staff) throw new Error('Staff insert returned nothing');

    await recordAudit(tx, {
      ...audit(actor),
      action: 'staff.create',
      subjectType: 'user',
      subjectId: user.id,
      after: { email: data.email, role: role.key, partnerId: data.partnerId ?? null },
    });
    return { userId: user.id, staffMemberId: staff.id };
  });
}

export async function setStaffRole(
  db: Database,
  actor: Actor,
  input: { userId: string; roleKey: string },
) {
  const data = setStaffRoleInput.parse(input);
  await db.transaction(async (tx) => {
    const role = await findRole(tx, data.roleKey);
    const [current] = await tx
      .select({ roleKey: schema.roles.key })
      .from(schema.staffMembers)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.staffMembers.roleId))
      .where(eq(schema.staffMembers.userId, data.userId));
    if (!current) throw new IdentityError('staff_not_found', 'This person is not a staff member.');
    await tx
      .update(schema.staffMembers)
      .set({ roleId: role.id })
      .where(eq(schema.staffMembers.userId, data.userId));
    await recordAudit(tx, {
      ...audit(actor),
      action: 'staff.role_change',
      subjectType: 'user',
      subjectId: data.userId,
      before: { role: current.roleKey },
      after: { role: role.key },
    });
  });
}

/** Deactivating also ends every session at once, so access stops immediately. */
export async function setStaffActive(
  db: Database,
  actor: Actor,
  input: { userId: string; active: boolean },
) {
  const data = setStaffActiveInput.parse(input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.staffMembers)
      .set({ active: data.active })
      .where(eq(schema.staffMembers.userId, data.userId))
      .returning({ id: schema.staffMembers.id });
    if (updated.length === 0)
      throw new IdentityError('staff_not_found', 'This person is not a staff member.');
    if (!data.active)
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, data.userId));
    await recordAudit(tx, {
      ...audit(actor),
      action: data.active ? 'staff.reactivate' : 'staff.deactivate',
      subjectType: 'user',
      subjectId: data.userId,
      after: { active: data.active },
    });
  });
}

/** Grants or removes one permission from a role. */
export async function setRolePermission(
  db: Database,
  actor: Actor,
  input: { roleKey: string; permission: string; granted: boolean },
) {
  const data = setRolePermissionInput.parse(input);
  if (
    data.roleKey === 'founder' &&
    !data.granted &&
    (FOUNDER_KEEPS as readonly string[]).includes(data.permission)
  ) {
    throw new IdentityError('founder_lockout', `The founder role must keep ${data.permission}.`);
  }
  await db.transaction(async (tx) => {
    const role = await findRole(tx, data.roleKey);
    const [permission] = await tx
      .select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(eq(schema.permissions.key, data.permission));
    if (!permission)
      throw new Error(`Permission ${data.permission} is not seeded; run pnpm db:seed:reference`);

    const changed = data.granted
      ? await tx
          .insert(schema.rolePermissions)
          .values({ roleId: role.id, permissionId: permission.id })
          .onConflictDoNothing()
          .returning({ id: schema.rolePermissions.id })
      : await tx
          .delete(schema.rolePermissions)
          .where(
            and(
              eq(schema.rolePermissions.roleId, role.id),
              eq(schema.rolePermissions.permissionId, permission.id),
            ),
          )
          .returning({ id: schema.rolePermissions.id });
    if (changed.length === 0) return;

    await recordAudit(tx, {
      ...audit(actor),
      action: data.granted ? 'role.permission_grant' : 'role.permission_revoke',
      subjectType: 'role',
      subjectId: role.id,
      after: { role: role.key, permission: data.permission },
    });
  });
}
