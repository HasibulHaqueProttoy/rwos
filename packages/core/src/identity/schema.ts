import { z } from 'zod';
import { isPermission } from './permissions';

export const createStaffInput = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(1).max(200),
  roleKey: z.string().trim().min(1),
  /** Partner users only: the partner they work for (the partners table arrives in Milestone 2). */
  partnerId: z.uuid().optional(),
});
export type CreateStaffInput = z.input<typeof createStaffInput>;

export const setStaffRoleInput = z.object({ userId: z.uuid(), roleKey: z.string().trim().min(1) });
export const setStaffActiveInput = z.object({ userId: z.uuid(), active: z.boolean() });

export const setRolePermissionInput = z.object({
  roleKey: z.string().trim().min(1),
  permission: z.string().refine(isPermission, { message: 'Unknown permission key' }),
  granted: z.boolean(),
});

/** Who is making a change, for the audit log. `userId` is null for the system and command-line tools. */
export interface Actor {
  userId: string | null;
  ip?: string | null;
  userAgent?: string | null;
}
