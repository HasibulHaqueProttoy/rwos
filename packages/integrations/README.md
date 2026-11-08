# @rwos/integrations

Interfaces for every outside service, each with a test provider that works without keys, plus the real adapters (see `docs/INTEGRATIONS.md`). App code depends on the interfaces only and never imports a provider SDK.

## Email

`EmailSender.send({ to, subject, text, html? })`

| Provider | When |
| --- | --- |
| `SmtpEmailSender` | Local (Mailpit, http://localhost:8025) and production (any transactional email service's SMTP) |
| `TestEmailSender` | Tests: keeps messages in memory (`sent`, `lastTo()`, `failNextWith`) |

`createEmailSender(EMAIL_PROVIDER, smtpConfig)` picks one. The message is already rendered; templates move to the notifications module with the outbox (task 1.9 and Milestone 3).

The other interfaces (payments, storage, jobs and the rest) arrive in task 1.9.
