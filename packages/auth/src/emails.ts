import type { EmailMessage } from '@rwos/integrations';
import { SIGN_IN_CODE } from './policy';

/** The sign-in code email. Plain words; the code never appears in the subject line. */
export function signInCodeEmail(to: string, code: string, subject: string): EmailMessage {
  const minutes = SIGN_IN_CODE.expiresInSeconds / 60;
  return {
    to,
    subject,
    text: [
      `Your sign-in code is ${code}.`,
      '',
      `It expires in ${minutes} minutes. If you did not ask for this code, you can ignore this email: nobody can sign in without it.`,
      '',
      'Rocket Wave',
    ].join('\n'),
  };
}
