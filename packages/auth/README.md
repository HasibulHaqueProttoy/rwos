# @rwos/auth

Sign-in for both apps, built on Better Auth (pinned to a release at least two weeks old; see decision 0007).

## How people sign in

| | Customers (app.rocketwave.co) | Staff (admin.rocketwave.co) |
| --- | --- | --- |
| First step | 6-digit code emailed to them | 6-digit code emailed to them (only if they are active staff) |
| Second step | Authenticator app, if they turned it on | Authenticator app, always; until set up, only setup is allowed |
| New accounts | Created by the first sign-in (checkout) | Never by signing in; an admin creates them |
| Turn two-factor off | Yes | No |
| Trust this device | Yes | No |
| Session ends after | 7 days without activity | 12 hours without activity |
| Cookie prefix | `rw` | `rw-admin` |

Codes: 6 digits, 5 minutes, 3 tries, stored hashed. Rate limits per IP address: 3 code requests, 5 code checks, 5 two-factor checks a minute.

## Using it in an app

```ts
// apps/admin/lib/services.ts creates { auth, db } once from the environment.
import { getStaffSession } from '@rwos/auth';

const result = await getStaffSession(auth, db, await headers());
if (result.status === 'signed_out') redirect('/sign-in');
if (result.status === 'two_factor_setup_required') redirect('/sign-in/two-factor');
// result.status === 'active': result.user, result.staff (role, partner)
```

- `getStaffSession` is the only way admin code reads who is signed in. It accepts a session only if the admin app made it, the user is active staff and not deleted, and two-factor is set up.
- `getCustomerSession` does the same for the customer app.
- The Better Auth endpoints are served at `/api/auth/*` in each app (`app/api/auth/[...all]/route.ts`).

## Audit

Every completed sign-in writes `auth.sign_in` (with the method: `email_code`, `email_code_and_totp`, `email_code_and_backup_code`); turning two-factor on or off writes `auth.two_factor_enabled` / `auth.two_factor_disabled`. A sign-in still waiting for its second factor is not recorded.

## Why the two-factor plugin is extended

Better Auth's two-factor plugin only challenges password sign-ins. Rocket Wave has no passwords, so `createAuth` points the plugin's own challenge at the email-code sign-in as well. An integration test fails if this ever stops working (for example after a Better Auth upgrade): it signs a staff member in with only the emailed code and expects no session.

## Tests

- `pnpm --filter @rwos/auth test`: rules and email wording.
- `pnpm --filter @rwos/auth test:integration`: 22 end-to-end sign-in tests against a throwaway database (codes, two-factor, staff rules, session separation, rate limiting, encrypted secrets, audit entries).
