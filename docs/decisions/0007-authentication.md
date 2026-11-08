# 0007: Authentication

Date: 2026-11-08 · Status: accepted · Login changes need two human reviewers (CLAUDE.md)

## Decisions

- **No passwords for anyone.** Customers and staff both sign in with a 6-digit code emailed to them (SECURITY.md: customers passwordless; staff "email + two-factor"). No password storage, resets or reuse risk.
- **Staff second factor: authenticator app (TOTP), always.** A staff member who has not set one up can do nothing in the admin except set it up. Staff cannot turn it off or skip it on a "trusted device". Passkeys are added with the admin sign-in screen (task 1.11), where they can be tested in a real browser.
- **Reuse Better Auth's own two-factor challenge.** Its two-factor plugin only challenges password sign-ins, so `createAuth` extends the plugin's matcher to the email-code sign-in, reusing the vetted challenge logic (signed cookie, attempt limits, account lockout) instead of writing new security code. An integration test proves the emailed code alone never yields a session once two-factor is on.
- **One users table, two apps, stamped sessions.** Customers and staff are rows in `users`; staff also have a `staff_members` row. Each app runs its own Better Auth instance with its own cookie prefix, and every session carries `audience` (admin or customer). `getStaffSession` and `getCustomerSession` refuse a session from the other app.
- **Staff accounts are never self-created.** Sign-up is off in the admin, a database hook refuses user creation there, and codes are only emailed to active staff. Unknown addresses get the same "code sent" reply.
- **Session lengths:** staff 12 hours of inactivity (SECURITY.md); customers 7 days of inactivity (chosen here: long enough for an installed PWA, short enough for an account holding identity documents; a setting in `policy.ts`).
- **Audit:** completed sign-ins and two-factor changes write `audit_log` rows through `@rwos/core`'s `recordAudit`. The audit hook is a plugin placed after two-factor, because Better Auth runs the app's own hooks before plugin hooks.
- **Dependency age:** for login and payment libraries, use the newest release that has been public for at least two weeks (Better Auth 1.7.13, nodemailer 10.2.1 at the time of writing), so a bad release has time to be caught.
- **Email sending** goes through `EmailSender` in `@rwos/integrations` (SMTP: Mailpit locally, any transactional service in production), added here ahead of the rest of task 1.9 because sign-in codes need it.

## Why

Formation customers trust Rocket Wave with passports and company records; staff accounts can see all of them. The design removes passwords entirely, makes the staff second factor impossible to skip, and keeps the two apps' sessions strictly apart, while relying on Better Auth's tested code for the security-critical parts.
