# Product requirements

Full spec (living document): Rocket Wave Business OS Product Spec, https://claude.ai/artifact/3BFQMjuKNR9wUKZhtYv4Fh. This file is the build-ready summary; when they disagree, ask.

## Who uses it

| User | Needs |
| --- | --- |
| Non-resident founder (about 95% today, mostly Bangladesh) | Talks to sales first, pays by invoice in BDT or USD, wants clear progress and reminders |
| US-resident founder | Self-serve checkout, card payment, auto-renew, home-state registration, S-Corp option |
| Sales (2 people) | Leads, quotes, discounts, follow-ups, renewals |
| Operations (1 person, cross-functional team) | Priority task list across every case, documents, partner hand-offs |
| Finance and founders | Every money movement, profit per order, investor metrics |
| External partners | Only the cases assigned to them |

## Products

- **Formation:** US LLC, C-Corp (all 50 states + DC; S-Corp election only if every owner is a US person), UK LTD (Package A, B), UAE Free Zone via IFZA (0 to 4+ visas), Bangladesh private limited company (quote builder; formation only).
- **Service requests:** EIN, ITIN, reseller permit, sales tax, federal tax return, dissolution, amendments, good standing, unique address and renewals, Financial Tool Support ($149: bank and payment gateway applications), home-state foreign registration.
- **Compliance:** compliance calendar from rules, annual filings, registered agent and address renewals, Annual Compliance Plan.
- **Add-on modules (Business OS):** Business Email, Domain, Business Line (white-label VoIP; no guarantee for banking or WhatsApp verification), Invoicing, Accounting Connect, Business OS Pack.

## Customer journeys

- **US and UK:** country, package, company name, one-page checkout (passwordless account, payment), then onboarding form, KYC, signature, order tracker.
- **UAE:** short pre-qualification, booked consultation, custom quote, invoice payment in full, custom onboarding form unlocked on payment.
- **Bangladesh:** authorized capital and directors give a live quote (service fee BDT 25,000 + RJSC fees + VAT); "Talk to sales" is the main action.
- Abandoned checkouts become leads with the step they stopped at.

## Must-have capabilities (first release)

1. Staff accounts, roles, permissions, approvals, audit log
2. Leads pipeline (manual entry for now), quotes, discounts with approval tiers
3. Orders, cases, task tracker with automatic priority, partner assignment
4. Invoices, payments, receipts, credit notes, refunds with policy checks
5. Money ledger across two entities (Rocket Wave Inc and the Bangladesh proprietorship), partner payouts, fees, monthly inputs (marketing spend, expenses), reconciliation, month close
6. Metrics: active businesses, net revenue, gross margin, ARR, renewal rate, churn, LTV, CAC, refund rate, attach rate, lead conversion, collections, operations
7. Customer app: checkout, onboarding, KYC (co-owner invites), signature step, order tracker, document vault, compliance calendar, renewals, support tickets, notifications, rewards, wallet, promo codes, refer and earn, settings, multiple companies, team members
8. Compliance rules engine with sources, verification dates and overrides
9. Price Book with all pricing shapes, government fee tables, payment channel configuration
10. Global search, filters, saved views, CSV export on every admin list
11. Mail log, name rejection flow, affiliate income tracking
12. Data retention and offboarding (export, archive KYC 5 years, delete)

## Out of scope for now

Registry APIs (all filing is manual), Bangladesh TIN/BIN/Trade License/taxation (kept as disabled products), automated WhatsApp sending, Meta lead sync, Bangla interface.
