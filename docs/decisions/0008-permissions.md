# 0008: Roles and permissions

Date: 2026-11-08 · Status: accepted · Permission changes need two human reviewers (CLAUDE.md)

## Decisions

- **Permission keys in code, grants in the database.** The catalogue of keys code can check lives in `packages/core/src/identity/permissions.ts` (code has to name what it checks). Which role holds which key lives in `role_permissions`, edited from the admin (CLAUDE.md: permissions are config). Code checks keys, never role names.
- **Seeded once, then owned by the admin.** The reference seed creates the six roles with their defaults on a new database and grants newly added keys to the roles whose defaults include them, but never removes or re-adds a grant on an existing role, so admin edits survive every deploy.
- **No lock-out.** The founder role can never lose `staff.manage` or `roles.manage`.
- **Fresh on every request.** `authorize()` reads permissions from the database each time, so revoking a permission or deactivating someone applies on the next request; deactivation also deletes their sessions.
- **Staff and customers stay separate accounts.** `createStaffMember` refuses an email that belongs to a customer, so a customer account never silently gains staff access.

## The role table

From the product spec's role table, plus four points the docs left unclear, decided by the owner on 8 November 2026:

1. Operations see **only the cases assigned to them** (the spec's data protection section), not the whole board; founders see every case and assign.
2. Sales may see **invoice and payment status, read-only**.
3. **Founders and operations** may edit compliance rules (operations run the quarterly verification).
4. **Support and founders** may view the customer app as a customer (read-only, every use logged).

Tests in `packages/core/src/identity/roles.test.ts` encode both the spec table and these decisions.

## Why

Five to six staff plus external partners share one admin that holds passports, money and company records. A small, explicit catalogue checked on every request, with the role table as editable data, gives least-privilege access without code changes when the team changes.
