/** One email, already rendered. Templates are rendered by the notifications module before sending. */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body; always required so every email reads well in any client. */
  text: string;
  html?: string;
}

/** The only way app code sends email (docs/INTEGRATIONS.md). */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
