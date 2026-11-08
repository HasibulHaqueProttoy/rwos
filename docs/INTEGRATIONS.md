# Integrations

Every outside service is an interface in `packages/integrations/src/<name>/` with:

- `types.ts`: the interface the app depends on
- `test-provider.ts`: realistic fake (success, failure, delay, fake webhooks); works with no keys
- `<provider>.ts`: real adapter, added when the developer connects it
- `README.md`: how to connect the real provider, step by step

The active provider per environment comes from `integration_settings` (keys encrypted, entered in admin settings) or environment variables. App code never imports a provider SDK.

| Interface | Methods (minimum) | Real providers |
| --- | --- | --- |
| PaymentProvider | createCheckout, createPaymentLink, refund, verifyWebhook, parseWebhook, listSettlements | Stripe, Mollie, SSLCommerz |
| EmailSender | send(templateKey, to, data) | Postmark or Resend |
| SmsSender | send(to, body) | Bangladesh SMS gateway, US provider with 10DLC |
| WhatsAppLinkBuilder | buildLink(phone, text) | wa.me links now; WhatsApp Business Platform later |
| TeamNotifier | post(channelKey, message, link) | Slack incoming webhooks |
| FileStorage | put, getSignedUrl, delete, copyToArchive | S3, Cloudflare R2, Supabase Storage, MinIO (local) |
| JobQueue | enqueue, schedule, process | BullMQ + Redis; Inngest optional |
| KycProvider | submit, getResult | Manual review now; provider later |
| PhoneNumberProvider | search, purchase, release, configure | White-label VoIP partner |
| DomainProvider | check, register, renew, setDns | Domain reseller |
| MailboxProvider | createMailbox, suspend, delete | Email reseller |
| AccountingConnector | connect, sync, getReports | Unified accounting API |
| FxRateProvider | getRate(from, to, date) | Rate provider |

## Webhook handling (all providers)

1. Route `POST /api/webhooks/<provider>` verifies the signature with the provider's secret.
2. Insert into `webhook_events` (unique on provider + external_id); a duplicate returns 200 and stops.
3. Enqueue a job; respond 200 quickly.
4. The job processes the event inside a transaction, records the result, retries with backoff, and shows failures in admin with a replay button.

## Connecting a real provider (developer checklist)

1. Add the adapter implementing the interface, with tests using recorded sample payloads.
2. Add the secret names to `.env.example` (never values).
3. Enter keys in admin settings for staging; run the provider's test mode end to end.
4. Switch production after staging passes; record the change in `docs/decisions/`.
