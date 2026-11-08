# Chart of accounts

Status: **draft, version 1 (8 November 2026).** Prepared for the Milestone 2 ledger. The structure, the posting rules and the worked examples are ready to build from. The items in "Needs a licensed accountant" must be confirmed by a chartered accountant who knows Bangladesh Bank foreign exchange rules and Bangladesh VAT before the ledger is used for real money. Rocket Wave is a business operating system and not a law firm or tax firm; this document is an operating design, not tax advice.

This file is the source for the `ledger_accounts` seed. Accounts are data (edited in the admin, every change audited); this file records the starting set and the reasons behind it.

## Principles

1. **Two sets of books, one per legal entity.** Rocket Wave Inc (US, base currency USD) and the Bangladesh proprietorship (base currency BDT). Every ledger entry belongs to exactly one entity, and every payment channel belongs to the entity whose account receives the money (`payment_channels.legal_entity_id`).
2. **Same codes in both entities.** An account code means the same thing in both books (for example `2100` is always "government fees held for customers"). Accounts that do not apply to an entity are seeded inactive there. This keeps reports and the export to accounting software simple.
3. **Accrual basis.** Revenue is earned when the service is delivered, costs are matched to the order that caused them, money owed and money held for others are liabilities. Cash basis would make profit per order wrong whenever partners are paid in advance.
4. **Few accounts, many dimensions.** Do not create an account per jurisdiction, product or channel. Every ledger line already links to an order; jurisdiction, product, segment, state and channel come from the order and the payment. Reports slice by those dimensions.
5. **Money that is not ours never touches income.** Government fees, VAT and wallet balances are liabilities from the moment they are received. Net revenue in the metrics dashboard is then simply income accounts minus contra-income accounts.
6. **Append-only.** Entries are never edited or deleted; a mistake is fixed with a reversing entry (`ledger_entries.reversed_entry_id`). A closed month (`month_closes`) accepts no new entries dated inside it.
7. **Multi-currency.** Each line stores its own currency and the rate to USD on that day (`fx_rate_to_usd`). Each entity reports in its base currency; group reports convert to USD. Differences between the rate at invoice and the rate at settlement go to `7000`.

## Account list

Kinds: asset, liability, equity, income, contra-income (reduces income), cost of sales, expense, other. "Inc" and "BD" show which entity uses the account; "both" means it is active in both books.

### 1000 to 1999: Assets

| Code | Name | Entity | Use |
| --- | --- | --- | --- |
| 1010 | Operating bank account | both | Inc: US bank account (USD). BD: Bangladesh bank account (BDT). |
| 1020 | Mollie balance | Inc | Money collected by Mollie, not yet settled to the bank. |
| 1030 | Stripe balance | Inc | Card payments and auto-renew for US-resident customers, before payout. |
| 1040 | SSLCommerz balance | BD | BDT collections (bKash, Nagad, cards) before settlement. |
| 1050 | bKash merchant balance | BD | Legacy channel; kept for past payments and their settlements only. |
| 1060 | PayPal balance | Inc | Used to pay partners. |
| 1070 | WorldFirst balance | Inc | Used to pay partners. |
| 1090 | Payments awaiting match | both | Bank transfers received but not yet matched to an invoice. |
| 1100 | Accounts receivable | both | Issued invoices not yet paid (quotes, renewals, UAE custom quotes). |
| 1200 | Prepaid partner costs | both | Partner paid in advance for a case not yet delivered. Moves to `5000` on delivery. |
| 1210 | Government fees paid in advance | both | A government fee Rocket Wave paid before the customer paid for it. Cleared when the customer pays. |
| 1300 | Due from the other entity | both | Money the other Rocket Wave entity owes this one. Must equal `2600` in the other entity's books. |
| 1400 | Prepaid expenses | both | Yearly software and other costs paid in advance, spread monthly. |
| 1500 | VAT recoverable | BD | Input VAT that can be offset, only if the proprietorship is VAT-registered and the rules allow it. Inactive until confirmed. |

### 2000 to 2999: Liabilities

| Code | Name | Entity | Use |
| --- | --- | --- | --- |
| 2000 | Partner bills payable | both | Partner work delivered, bill not yet paid. |
| 2010 | Supplier bills payable | both | Other suppliers (software, rent, professional fees). |
| 2100 | Government fees held for customers | both | Pass-through government fees collected, not yet paid to the authority. Never income. |
| 2200 | Customer payments for services not yet delivered | both | Service fees paid before the case is delivered. Moves to income on delivery. |
| 2210 | Prepaid renewals and plans | both | Yearly items (registered agent, address, Annual Compliance Plan, add-on subscriptions) paid for a future period. Moves to income month by month. |
| 2300 | Customer wallet balances | both | Wallet credit from refunds, referrals, goodwill, promotions and top-ups. Owed to customers until spent. |
| 2400 | VAT payable | BD | 15% VAT collected on BDT invoices where it applies. |
| 2410 | US sales tax payable | Inc | Placeholder, inactive. Only if a state requires it for a product Rocket Wave sells. |
| 2500 | Refunds payable | both | Refund approved, not yet paid out. |
| 2600 | Due to the other entity | both | Money this entity owes the other Rocket Wave entity. Must equal `1300` in the other entity's books. |
| 2700 | Salaries and contractor fees payable | both | Accrued staff costs not yet paid. |

### 3000 to 3999: Equity

| Code | Name | Entity | Use |
| --- | --- | --- | --- |
| 3000 | Share capital | Inc | Capital paid in by shareholders. |
| 3010 | Owner's capital | BD | Money the proprietor puts into the business. |
| 3100 | Owner's drawings | BD | Money the proprietor takes out (a proprietorship has no salary for the owner). |
| 3200 | Retained earnings | both | Profit kept from closed years. |
| 3300 | Current year profit | both | Calculated by the system at each month close, never posted by hand. |

### 4000 to 4999: Income

| Code | Name | Kind | Use |
| --- | --- | --- | --- |
| 4000 | Formation service fees | income | US, UK, UAE and Bangladesh formation, Rocket Wave's service fee only. |
| 4010 | Service request fees | income | EIN, ITIN, amendments, good standing, dissolution, reseller permit, sales tax, foreign registration, name change re-filing when charged. |
| 4020 | Compliance and renewal fees | income | Registered agent, address, annual filings, Annual Compliance Plan, tax filing services. |
| 4030 | Add-on module fees | income | Business Email, Domain, Business Line, Invoicing, Accounting Connect, Business OS Pack. |
| 4040 | Financial Tool Support fees | income | Bank and payment gateway application support. |
| 4100 | Affiliate and referral commissions | income | Commissions from reward partners (Wise, Payoneer and others). |
| 4200 | Reactivation and late fees | income | Fees charged when a paused service is restarted. |
| 4900 | Refunds and credit notes | contra-income | Refunds of revenue already earned (after delivery). |
| 4910 | Discounts and promo codes | contra-income | Discounts recorded against a sale, so margin reports show what each promo cost. |
| 4920 | Early-payment rewards | contra-income | The 5% wallet credit for paying a renewal 30 or more days early. |

### 5000 to 5999: Cost of sales (costs caused by a specific order)

| Code | Name | Use |
| --- | --- | --- |
| 5000 | Partner costs | Registered agent, filing partner, tax preparer, IFZA, Bangladesh legal partner. Recognised when the case is delivered. |
| 5100 | Payment collection fees | Mollie, Stripe, SSLCommerz and bank fees on customer payments. |
| 5200 | Add-on wholesale costs | Domain, mailbox and phone number wholesale costs. |
| 5300 | Government fees absorbed | A government fee Rocket Wave pays without passing it on (for example a re-filing after a name rejection when the customer is not charged). |
| 5400 | Partner payout fees | PayPal, WorldFirst, Mollie and bank fees on paying partners, including the foreign exchange spread. |
| 5500 | Per-order software costs | Costs charged per order or check (identity checks, e-signature) once real providers are connected. |

### 6000 to 6999: Operating expenses (entered monthly in `monthly_inputs`)

| Code | Name | Use |
| --- | --- | --- |
| 6000 | Salaries and contractors | Staff and contractor pay. |
| 6100 | Advertising | Paid ads; the channel (Meta, Google and so on) is a dimension, not an account. |
| 6110 | Referral and promotional credits | Wallet credit given for refer and earn and promotions (a customer acquisition cost). |
| 6120 | Customer goodwill credits | Wallet credit given by staff to resolve a problem. |
| 6200 | Software and hosting | Hosting, tools and subscriptions not tied to one order. |
| 6300 | Rent and office | Office and co-working costs. |
| 6400 | Professional fees | Accountant, lawyers, auditors, security test. |
| 6500 | General bank charges | Account fees not tied to collecting a payment. |
| 6600 | Travel | Business travel. |
| 6700 | Phone and internet | Office phone and internet. |
| 6900 | Other operating expenses | Anything else; review monthly and add an account if a cost recurs. |

### 7000 to 7999: Other income and costs

| Code | Name | Use |
| --- | --- | --- |
| 7000 | Foreign exchange gains and losses | Difference between the rate when invoiced or held and the rate when settled or paid. |
| 7100 | Interest income | Bank interest. |
| 7200 | Government penalties and interest | Penalties Rocket Wave itself pays. Kept separate because they are usually not tax-deductible. |
| 7300 | Income tax | Inc: US federal and state income tax. BD: none here, because a proprietorship's profit is taxed as the proprietor's personal income. |

## Posting rules

Each event in the app creates one balanced entry automatically. The rules below are the defaults; in Milestone 2 they become rows in a posting-rule table so the accountant can change an account without a code change.

| Event | Debit | Credit | Notes |
| --- | --- | --- | --- |
| Customer pays an order (gateway) | Gateway balance (`1020`/`1030`/`1040`) for the gross | `2200` service fee, `2100` government fees, `2400` VAT (BD) | Discounts: debit `4910`, credit `2200` for the discount amount, so the sale is recorded at list price and the discount is visible. |
| Customer pays by bank transfer | `1090` until matched, then `1010` | Same as above | Finance attaches the proof; matching moves `1090` to `1010`. |
| Invoice issued before payment | `1100` | `2200`, `2100`, `2400` | Payment then credits `1100`. |
| Gateway fee on a payment | `5100` | Gateway balance | Taken from the gateway's settlement report. |
| Gateway settles to the bank | `1010` | Gateway balance | Matched against the bank statement at month close. |
| Government fee paid to the authority | `2100` | `1010` (or the card's bank) | Ops records the receipt or confirmation number. Paid before the customer paid: debit `1210` instead, cleared when the customer pays. |
| Partner paid in advance | `1200` and `5400` (payout fee) | `1060`/`1070`/`1020`/`1010` | A payout must name a case. |
| Partner bill for delivered work, paid later | `5000` | `2000` | Payment then debits `2000`. |
| Case delivered | `2200` | Income account for the product (`4000` to `4040`) | Also: debit `5000`, credit `1200` for the partner cost prepaid on that case. |
| Yearly item paid (renewal, plan, subscription) | Gateway or bank | `2210` | Each month: debit `2210`, credit `4020` or `4030` for one twelfth (or the item's own period). |
| Refund before delivery | `2200` (service fee part) | `2500` | Government fees not yet paid: debit `2100`. Fees already paid out are not refundable (refund policy). |
| Refund after delivery | `4900` | `2500` | A credit note is issued automatically; the original invoice never changes. |
| Refund paid out | `2500` | Gateway balance or `1010` | Gateway refund ID required. |
| Refund given as wallet credit | `2200` or `4900` | `2300` | Instead of paying out. |
| Referral or promotional credit issued | `6110` | `2300` | Only after the referred order's refund window has passed. |
| Goodwill credit issued | `6120` | `2300` | Staff must give a reason; the entry shows who issued it. |
| Early-payment reward issued | `4920` | `2300` | 5% of the renewal, when paid 30 or more days early. |
| Wallet top-up | Gateway or bank | `2300` | |
| Wallet spent at checkout or on a renewal | `2300` | `2200` or `2210` | |
| Affiliate commission received | Bank or `1060` | `4100` | Recorded when received; the affiliate module tracks expected amounts separately. |
| Monthly expense input | `6000` to `6900` | `1010`, `2010` or `2700` | Entered by the founder each month by category. |
| Transfer between the two entities | Receiving entity: `1010`; sending entity: `2600` (or `1300`) | Receiving entity: `1300` (or `2600`); sending entity: `1010` | Recorded in both books with the bank reference on both sides; amounts must match after currency conversion. |
| Settlement in a different rate than recorded | `7000` (loss) | `7000` (gain) | Calculated by the system on settlement. |

## Worked examples

### US LLC in Wyoming, paid in USD (Rocket Wave Inc)

The order from the product spec: $301 paid by card through Mollie, made of the $197 service fee and the $104 Wyoming filing fee. Fee amounts below are for illustration only; real amounts come from each provider's report.

| Step | Debit | Credit |
| --- | --- | --- |
| Customer pays $301 | `1020` Mollie balance $301.00 | `2200` $197.00, `2100` $104.00 |
| Mollie fee (illustrative $9.00) | `5100` $9.00 | `1020` $9.00 |
| Ops files and pays Wyoming $104 | `2100` $104.00 | `1010` $104.00 |
| Registered agent partner prepaid by PayPal (illustrative $50.00, PayPal fee $2.00) | `1200` $50.00, `5400` $2.00 | `1060` $52.00 |
| Case delivered | `2200` $197.00 and `5000` $50.00 | `4000` $197.00 and `1200` $50.00 |
| Mollie settles to the bank | `1010` $292.00 | `1020` $292.00 |

Result for this order: income $197, cost of sales $61 ($50 partner, $9 collection fee, $2 payout fee), gross margin $136. The $104 state fee never appears in income or cost; it passed through `2100`.

### Refund under the US 50% rule

The customer cancels after registration and before the EIN application, so the refund policy allows 50% of the service fee. The case is not delivered, so the service fee is still in `2200`.

| Step | Debit | Credit |
| --- | --- | --- |
| Refund approved ($98.50) | `2200` $98.50 | `2500` $98.50 |
| Refund paid through Mollie | `2500` $98.50 | `1020` $98.50 |
| Remaining fee earned when the case is closed | `2200` $98.50 | `4000` $98.50 |

The state fee was already paid to Wyoming, so it is not refundable and nothing moves in `2100`.

### Bangladesh formation, paid in BDT (Bangladesh proprietorship)

A customer pays the BDT 25,000 service fee, the RJSC government fees and VAT through SSLCommerz. Amounts follow the order's own figures (`subtotal_minor`, `government_fee_minor`, `vat_minor`); none are typed by hand.

| Step | Debit | Credit |
| --- | --- | --- |
| Customer pays | `1040` SSLCommerz balance (gross) | `2200` service fee, `2100` RJSC fees, `2400` VAT |
| SSLCommerz fee | `5100` | `1040` |
| RJSC fees paid on filing | `2100` | `1010` |
| VAT paid with the VAT return | `2400` | `1010` |
| Case delivered | `2200` | `4000` |

### BDT payment for a US or UK service (both entities)

This is the case the launch checklist calls out: the customer contracts with Rocket Wave Inc but pays BDT into the proprietorship's account. The default design treats the proprietorship as **collection agent** for the Inc, matching the checklist item "agreement covering BDT collections made on the Inc's behalf". This must be confirmed by the accountant (see below) before go-live.

| Book | Debit | Credit |
| --- | --- | --- |
| Proprietorship (BDT): customer pays | `1040` gross | `2600` due to Inc (service fee and government fees), `2400` VAT if it applies |
| Inc (USD): same payment | `1300` due from the proprietorship | `2200` service fee, `2100` government fees |
| Proprietorship pays a partner for the Inc's case | `2600` | `1010` |
| Inc records the same partner payment | `1200` (or `5000`) | `1300` |
| Money remitted from the proprietorship to the Inc | Proprietorship: `2600`; Inc: `1010` | Proprietorship: `1010`; Inc: `1300` |

At every month close, `1300` in one book must equal `2600` in the other (after conversion at the recorded rates). The reconciliation screen lists any difference.

## How this feeds the metrics dashboard

| Metric | From the ledger |
| --- | --- |
| Net revenue | Income `4000` to `4200` minus contra-income `4900` to `4920`. Government fees and VAT are excluded automatically because they never reach income. |
| Gross margin | Net revenue minus cost of sales `5000` to `5500`, per order, product, jurisdiction and month. |
| Refund rate | `4900` plus refunds taken from `2200`, against gross sales. |
| CAC | `6100` and `6110` per channel, divided by new paying customers. |
| Money held for others | Balances of `2100`, `2300` and `2400` (never treated as available cash). |

## Fiscal years and closing

- **Inc:** calendar year (January to December), the usual default. Confirm with the accountant, because a US corporation may choose another year.
- **Proprietorship:** July to June, Bangladesh's income year.
- Months close per entity. A month closes only when the bank and gateway statements for that entity are fully matched (`bank_statement_lines` with no unmatched rows) and `1300`/`2600` agree between the entities.
- At year end, `3300` moves to `3200` automatically.
- Each entity exports to its own organisation in Zoho Books or Xero using these codes.

## Data model changes this needs (Milestone 2, with the ledger migration)

- `ledger_accounts.kind`: add `equity`, `contra_income`, `cost_of_sales` and `other` to the allowed values.
- `ledger_accounts`: add `active` (per entity) and `description`.
- New table for posting rules: event type, legal entity, debit account, credit account, active, valid from. Edited in the admin, audited.
- Update `DATA_MODEL.md` in the same pull request as that migration.

## Needs a licensed accountant before real money goes through the ledger

The structure above works for any answer to these questions; the answers decide which posting rules are switched on.

1. **Bangladesh foreign exchange.** Can the proprietorship collect BDT for services contracted by a US company, pay foreign partners from that money and remit the balance to the Inc, under Bangladesh Bank rules? If not, the model changes (for example the proprietorship resells as principal and buys the service from the Inc).
2. **Bangladesh VAT.** Is the proprietorship VAT-registered (BIN)? Is 15% charged on the whole invoice or only the service fee? Does any formation sold to a Bangladesh resident for a company abroad count as an export of services (zero-rated)? Is VAT shown on top of or inside the price?
3. **Revenue timing.** Confirm earning the service fee on delivery (this design) rather than on payment, and spreading yearly items monthly.
4. **Inc tax position.** Whether income collected in Bangladesh for the Inc creates a taxable presence in Bangladesh, and the Inc's US filing obligations.
5. **Government penalties and owner's drawings.** Confirm their tax treatment in each country.
6. **Opening balances.** The accountant provides opening balances for each entity as of the switch-over date.
