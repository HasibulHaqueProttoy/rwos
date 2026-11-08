# identity

Owns staff, roles, permissions and their management. Sign-in itself is in `@rwos/auth`.

## Permissions

- `permissions.ts` is the catalogue: every permission key code can check (`resource.action`, for example `ledger.read`), each with a description. Code checks keys, never role names.
- `roles.ts` holds the six starting roles and their default permissions, from the product spec's role table and the decisions of 8 November 2026 (decision 0008).
- `seed.ts` (`rolesAndPermissionsSeed`, a reference seed, runs on every deploy):
  - adds new permission keys and keeps descriptions current;
  - adds missing roles with their defaults;
  - grants a newly added key to the roles whose defaults include it;
  - never removes or re-adds a grant on an existing role, so admin edits stay.

| Role | In short |
| --- | --- |
| founder | Everything |
| sales | Leads, quotes, customers, orders, discounts within the tiers, refund requests, invoice status (read-only) |
| operations | Cases assigned to them and their tasks, identity document review, documents, compliance events and rules |
| finance | Invoices, payments, payouts, ledger, expenses, reports, metrics, paying out approved refunds |
| support | Tickets, customer status, read-only orders, view as customer |
| partner | Cases assigned to them, uploading documents |

Only founders approve refunds, discounts above the sales limit, payout recipients and prices, and manage staff and roles.

## Service

Each function changes data and writes its audit entry in one transaction. Callers check permission first (`authorize()` in `@rwos/auth`); command-line tools act as the system (`actor.userId = null`).

| Function | Audit action | Notes |
| --- | --- | --- |
| `createStaffMember` | `staff.create` | Refuses an email that is already staff or belongs to a customer |
| `setStaffRole` | `staff.role_change` | Records the role before and after |
| `setStaffActive` | `staff.deactivate` / `staff.reactivate` | Deactivating ends every session at once |
| `setRolePermission` | `role.permission_grant` / `role.permission_revoke` | No entry when nothing changes; the founder role always keeps `staff.manage` and `roles.manage` |

Command line: `pnpm staff:create --email <email> --name "<name>" --role <role key>`.
