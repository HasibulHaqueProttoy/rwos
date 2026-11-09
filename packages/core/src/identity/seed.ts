import { type Seed, schema } from '@rwos/db';
import { eq } from 'drizzle-orm';
import { permissionCatalog, permissionKeys } from './permissions';
import { defaultRoles } from './roles';

/**
 * Reference seed for roles and permissions; safe to run on every deploy.
 * - Adds new permission keys and keeps their descriptions current.
 * - Adds missing roles with their default permissions.
 * - Grants a newly added permission key to the roles whose defaults include it.
 * - Never removes or re-adds a grant on an existing role, so edits made in the admin stay.
 */
export const rolesAndPermissionsSeed: Seed = {
  name: 'roles and permissions',
  async run(tx) {
    const existingPermissions = await tx
      .select({ key: schema.permissions.key })
      .from(schema.permissions);
    const existingKeys = new Set(existingPermissions.map((row) => row.key));
    const newKeys = new Set(permissionKeys.filter((key) => !existingKeys.has(key)));

    for (const key of permissionKeys) {
      await tx
        .insert(schema.permissions)
        .values({ key, description: permissionCatalog[key] })
        .onConflictDoUpdate({
          target: schema.permissions.key,
          set: { description: permissionCatalog[key] },
        });
    }
    const permissionRows = await tx
      .select({ id: schema.permissions.id, key: schema.permissions.key })
      .from(schema.permissions);
    const permissionId = new Map(permissionRows.map((row) => [row.key, row.id]));

    for (const role of defaultRoles) {
      const inserted = await tx
        .insert(schema.roles)
        .values({ key: role.key, name: role.name, description: role.description })
        .onConflictDoNothing({ target: schema.roles.key })
        .returning({ id: schema.roles.id });
      const isNewRole = inserted.length > 0;
      const [roleRow] = await tx
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(eq(schema.roles.key, role.key));
      if (!roleRow) throw new Error(`Role ${role.key} missing after insert`);

      const toGrant = isNewRole
        ? role.permissions
        : role.permissions.filter((key) => newKeys.has(key));
      const ids = toGrant
        .map((key) => permissionId.get(key))
        .filter((id): id is string => Boolean(id));
      if (ids.length > 0) {
        await tx
          .insert(schema.rolePermissions)
          .values(ids.map((id) => ({ roleId: roleRow.id, permissionId: id })))
          .onConflictDoNothing();
      }
    }
  },
};
