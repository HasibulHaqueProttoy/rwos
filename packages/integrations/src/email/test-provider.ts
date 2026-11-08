import type { EmailMessage, EmailSender } from './types';

/** Keeps every message in memory instead of sending it. For tests; needs no keys or network. */
export class TestEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  /** When set, the next send fails with this error (to test failure handling). */
  failNextWith: Error | null = null;

  send(message: EmailMessage): Promise<void> {
    if (this.failNextWith) {
      const error = this.failNextWith;
      this.failNextWith = null;
      return Promise.reject(error);
    }
    this.sent.push(structuredClone(message));
    return Promise.resolve();
  }

  /** The most recent message to `to`, if any. */
  lastTo(to: string): EmailMessage | undefined {
    return this.sent.filter((message) => message.to === to).at(-1);
  }

  clear(): void {
    this.sent.length = 0;
  }
}
