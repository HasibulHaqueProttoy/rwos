import { describe, expect, it } from 'vitest';
import { SmtpEmailSender } from './smtp-provider';

// Sends a real message through the local Mailpit and reads it back from Mailpit's API.
const host = process.env.SMTP_HOST ?? 'localhost';
const port = Number(process.env.SMTP_PORT ?? 1025);
const mailpitApi = process.env.MAILPIT_API_URL ?? 'http://localhost:8025/api/v1';

describe('SmtpEmailSender against Mailpit', () => {
  it('delivers a message', async () => {
    const subject = `rwos smtp check ${Date.now()}`;
    await new SmtpEmailSender({ host, port, from: 'no-reply@rocketwave.local' }).send({
      to: 'founder@example.test',
      subject,
      text: 'Test message from the integration suite.',
    });
    const response = await fetch(
      `${mailpitApi}/search?query=${encodeURIComponent(`subject:"${subject}"`)}`,
    );
    const body = (await response.json()) as { messages: { Subject: string }[] };
    expect(body.messages.map((message) => message.Subject)).toContain(subject);
  });
});
