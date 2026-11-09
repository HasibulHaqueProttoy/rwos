/** Domain modules: business logic only, no UI and no provider SDKs. */
export { auditActionSchema, auditEntrySchema, type AuditEntry } from './audit/schema';
export { recordAudit } from './audit/service';
export { IdentityError } from './identity/errors';
export {
  isPermission,
  type Permission,
  permissionCatalog,
  permissionKeys,
} from './identity/permissions';
export { defaultRoles, type RoleDefinition } from './identity/roles';
export { type Actor, type CreateStaffInput } from './identity/schema';
export { rolesAndPermissionsSeed } from './identity/seed';
export {
  createStaffMember,
  setRolePermission,
  setStaffActive,
  setStaffRole,
} from './identity/service';
export { referenceSeeds, sampleSeeds } from './seeds';
