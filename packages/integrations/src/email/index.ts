import { SmtpEmailSender, type SmtpConfig } from './smtp-provider';
import { TestEmailSender } from './test-provider';
import type { EmailSender } from './types';

export type EmailProvider = 'smtp' | 'test';

/** Picks the email provider for this environment (EMAIL_PROVIDER). */
export function createEmailSender(provider: EmailProvider, smtp: SmtpConfig): EmailSender {
  return provider === 'test' ? new TestEmailSender() : new SmtpEmailSender(smtp);
}

export { SmtpEmailSender, TestEmailSender };
export type { EmailMessage, EmailSender } from './types';
export type { SmtpConfig };
