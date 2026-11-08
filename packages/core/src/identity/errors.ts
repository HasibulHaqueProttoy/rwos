/** Errors the identity service throws; each message is safe to show to staff. */
export class IdentityError extends Error {
  constructor(
    readonly code:
      | 'role_not_found'
      | 'email_in_use_by_customer'
      | 'already_staff'
      | 'staff_not_found'
      | 'founder_lockout',
    message: string,
  ) {
    super(message);
    this.name = 'IdentityError';
  }
}
