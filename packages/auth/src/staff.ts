import { type Database, schema } from '@rwos/db';
import { and, eq, isNull } from 'drizzle-orm';

export interface ActiveStaff {
  userId: string;
  roleId: string;
  partnerId: string | null;
}

/** The staff record for a user who is staff, active, and not deleted; otherwise null. */
export async function findActiveStaff(
  db: Database,
  by: { userId: string } | { email: string },
): Promise<ActiveStaff | null> {
  const userMatch =
    'userId' in by
      ? eq(schema.users.id, by.userId)
      : eq(schema.users.email, by.email.toLowerCase());
  const [row] = await db
    .select({
      userId: schema.staffMembers.userId,
      roleId: schema.staffMembers.roleId,
      partnerId: schema.staffMembers.partnerId,
    })
    .from(schema.staffMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.staffMembers.userId))
    .where(
      and(
        userMatch,
        eq(schema.users.isStaff, true),
        isNull(schema.users.deletedAt),
        eq(schema.staffMembers.active, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Whether the user exists and is not deleted. */
export async function isLiveUser(db: Database, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)))
    .limit(1);
  return Boolean(row);
}
