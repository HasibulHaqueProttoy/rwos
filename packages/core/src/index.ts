/** Domain modules: business logic only, no UI and no provider SDKs. */
export { auditActionSchema, auditEntrySchema, type AuditEntry } from './audit/schema';
export { recordAudit } from './audit/service';
