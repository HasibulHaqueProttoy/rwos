# audit

Owns writing to `audit_log`.

- `recordAudit(dbOrTransaction, entry)` validates the entry (Zod) and inserts one row. Call it in the same transaction as the change, so both are saved or neither is.
- Every change to money, permissions, KYC documents, prices or compliance rules writes an entry (CLAUDE.md), with `before` and `after` snapshots.
- Sign-in events, two-factor changes and sign-out are recorded by `@rwos/auth`.
- The table is append-only: database triggers reject UPDATE, DELETE and TRUNCATE for every role (migration `0002_audit_log_append_only`).
- Action names are dotted and lower case: `auth.sign_in`, `price.update`, `refund.approve`.
- No secrets, passwords, codes or document numbers in snapshots; IP address and user agent are allowed.
