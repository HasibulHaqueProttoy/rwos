import { describe, expect, it } from 'vitest';
import { createEmailSender, TestEmailSender } from './index';

describe('TestEmailSender', () => {
  it('records each message and finds the latest for an address', async () => {
    const sender = new TestEmailSender();
    await sender.send({ to: 'a@example.test', subject: 'One', text: 'First' });
    await sender.send({ to: 'a@example.test', subject: 'Two', text: 'Second' });
    expect(sender.sent).toHaveLength(2);
    expect(sender.lastTo('a@example.test')?.subject).toBe('Two');
    sender.clear();
    expect(sender.sent).toHaveLength(0);
  });

  it('can be told to fail once', async () => {
    const sender = new TestEmailSender();
    sender.failNextWith = new Error('SMTP down');
    await expect(sender.send({ to: 'a@example.test', subject: 'S', text: 'T' })).rejects.toThrow(
      'SMTP down',
    );
    await expect(
      sender.send({ to: 'a@example.test', subject: 'S', text: 'T' }),
    ).resolves.toBeUndefined();
  });
});

describe('createEmailSender', () => {
  it('returns the test provider when asked', () => {
    const smtp = { host: 'localhost', port: 1025, from: 'no-reply@rocketwave.local' };
    expect(createEmailSender('test', smtp)).toBeInstanceOf(TestEmailSender);
  });
});
