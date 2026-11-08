import type { Database } from '@rwos/db';
import type { Auth } from './create-auth';
import { type ActiveStaff, findActiveStaff, isLiveUser } from './staff';

type BetterAuthSession = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

export type StaffSessionResult =
  | { status: 'signed_out' }
  /** Signed in with the emailed code but has no authenticator yet: only two-factor setup is allowed. */
  | {
      status: 'two_factor_setup_required';
      user: BetterAuthSession['user'];
      session: BetterAuthSession['session'];
    }
  | {
      status: 'active';
      user: BetterAuthSession['user'];
      session: BetterAuthSession['session'];
      staff: ActiveStaff;
    };

/**
 * The only way admin code reads who is signed in. It accepts a session only when it was made
 * by the admin app, the user is active staff and not deleted, and two-factor is set up.
 */
export async function getStaffSession(
  auth: Auth,
  db: Database,
  headers: Headers,
): Promise<StaffSessionResult> {
  const result = await auth.api.getSession({ headers });
  if (!result || result.session.audience !== 'admin') return { status: 'signed_out' };

  const staff = await findActiveStaff(db, { userId: result.user.id });
  if (!staff) return { status: 'signed_out' };

  if (!result.user.twoFactorEnabled) {
    return { status: 'two_factor_setup_required', user: result.user, session: result.session };
  }
  return { status: 'active', user: result.user, session: result.session, staff };
}

export type CustomerSessionResult =
  | { status: 'signed_out' }
  | { status: 'active'; user: BetterAuthSession['user']; session: BetterAuthSession['session'] };

/** The only way customer-app code reads who is signed in: a customer-app session for a live user. */
export async function getCustomerSession(
  auth: Auth,
  db: Database,
  headers: Headers,
): Promise<CustomerSessionResult> {
  const result = await auth.api.getSession({ headers });
  if (!result || result.session.audience !== 'customer') return { status: 'signed_out' };
  if (!(await isLiveUser(db, result.user.id))) return { status: 'signed_out' };
  return { status: 'active', user: result.user, session: result.session };
}
