import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, EmailSender } from './types';

export interface SmtpConfig {
  host: string;
  port: number;
  from: string;
  user?: string | undefined;
  password?: string | undefined;
}

/** Sends through any SMTP server: Mailpit locally, a transactional email service in production. */
export class SmtpEmailSender implements EmailSender {
  private readonly transport: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // Port 465 is TLS from the start; other ports upgrade with STARTTLS when the server offers it.
      secure: config.port === 465,
      ...(config.user ? { auth: { user: config.user, pass: config.password ?? '' } } : {}),
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
  }
}
