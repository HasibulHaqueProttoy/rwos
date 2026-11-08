# Data model

The source of truth for every table. Change this file in the same pull request as any migration.

## Conventions (apply to every table)

- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (trigger-maintained)
- Foreign keys always declared, with an explicit `on delete` rule (default `restrict`)
- Index on every foreign key and every column used to filter or search
- Status columns are Postgres enums or text with a `check` constraint
- Money: `amount_minor bigint not null` + `currency char(3) not null`
- Customer-owned tables carry `workspace_id uuid not null` and a row-level security policy
- Soft delete (`deleted_at timestamptz`) only where marked; everything else is never deleted
- Encrypted columns end in `_enc` (bytea) with a `_last4` or hash column when search is needed

## Identity and access

| Table | Key columns |
| --- | --- |
| users | email (unique), name, phone, timezone, is_staff, mfa_enabled, deleted_at |
| sessions, accounts, verifications | Better Auth tables |
| roles | key (founder, sales, operations, finance, support, partner), name |
| permissions | key (e.g. `ledger.read`, `refund.approve`), description |
| role_permissions | role_id, permission_id |
| staff_members | user_id, role_id, partner_id (for partner users), active |
| approval_rules | action (refund, discount, price_change, payout_recipient), condition jsonb, approver_role_id |
| approvals | rule_id, subject_type, subject_id, requested_by, decided_by, status, reason |
| audit_log | actor_user_id, action, subject_type, subject_id, before jsonb, after jsonb, ip, user_agent (append-only) |

## Workspaces and companies

| Table | Key columns |
| --- | --- |
| workspaces | name, segment (non_resident, us_resident), billing_country, preferred_currency |
| memberships | workspace_id, user_id, role (owner, admin, member, accountant) |
| invitations | workspace_id, email, role, token_hash, expires_at, accepted_at |
| companies | workspace_id, jurisdiction_code, state_code, entity_type, legal_name, status, formation_date, fiscal_year_end, registry_number, all_owners_us_persons, deleted_at |
| company_tax_ids | company_id, kind (ein, utr, trn, tin, bin), value_enc, value_last4 |
| people | workspace_id, full_name, email, phone, nationality, residency_country, is_us_person |
| company_roles | company_id, person_id, role (member, manager, director, shareholder, psc, ubo, responsible_party), ownership_bp (basis points) |
| addresses | owner_type, owner_id, kind, line1, line2, city, region, postal_code, country |

## KYC

| Table | Key columns |
| --- | --- |
| kyc_documents | workspace_id, person_id, kind (passport, nid, driving_licence, proof_of_address, selfie), file_id, number_enc, number_last4, expires_on, status (pending, approved, rejected), reviewed_by, reject_reason |
| kyc_invites | person_id, email, token_hash, expires_at, completed_at |

## Catalog and pricing (the Price Book)

| Table | Key columns |
| --- | --- |
| products | code (e.g. `formation.us.llc`), kind (formation, service, compliance, addon, bundle), name, jurisdiction_code, billing (one_time, recurring), requires_product_codes text[], quote_only, active |
| product_variants | product_id, code, name (e.g. "2 visas", "Package B") |
| prices | product_id, variant_id, segment, currency, amount_minor, interval (none, month, quarter, year), unit_name, min_quantity, valid_from, valid_to |
| government_fees | jurisdiction_code, state_code, product_id, amount_minor, currency, source_url, verified_on, valid_from, valid_to |
| bd_fee_slabs | component (registration, stamp_aoa, stamp_moa, filing, name_clearance, certified_copy), capital_from_minor, capital_to_minor, rule (flat, per_lakh), amount_minor, vat_applies, valid_from, valid_to |
| plans, plan_items | bundles and their included products and limits |
| promo_codes | code, kind (percent, fixed), value, product_scope, starts_at, ends_at, max_uses, max_uses_per_customer, campaign |
| payment_channels | name, provider, legal_entity_id, currency, fee_percent_bp, fee_fixed_minor, settlement_account_id, vat_percent_bp, active |

## Jurisdiction packs

| Table | Key columns |
| --- | --- |
| jurisdiction_packs | code (us, uk, uae_ifza, bd), name |
| pack_versions | pack_id, version, published_at |
| form_schemas | pack_version_id, product_id, schema jsonb |
| workflow_steps | pack_version_id, product_id, position, key, name, sla_hours, customer_visible, task_template_id |
| task_templates | key, title, checklist jsonb, default_role_id |
| document_templates | pack_version_id, key, name, file_id, signature_fields jsonb |

## Sales

| Table | Key columns |
| --- | --- |
| leads | name, email, phone, source, campaign, segment, stage (new, contacted, qualified, quote_sent, won, lost), lost_reason, owner_user_id, next_follow_up_at, abandoned_step |
| lead_activities | lead_id, kind (call, note, whatsapp, email), body, created_by |
| quotes | lead_id, workspace_id, status, expires_at, currency, total_minor |
| quote_lines | quote_id, product_id, variant_id, quantity, unit_minor, discount_minor, government_fee_minor |

## Orders and work

| Table | Key columns |
| --- | --- |
| orders | workspace_id, company_id, number, status, currency, subtotal_minor, discount_minor, government_fee_minor, vat_minor, total_minor, legal_entity_id, pack_version_id, promo_code_id |
| order_lines | order_id, product_id, variant_id, quantity, unit_minor (snapshot), government_fee_minor (snapshot), partner_cost_minor (snapshot) |
| cases | order_id, company_id, current_step_key, status, partner_id, expected_completion_on |
| case_events | case_id, kind, customer_visible, body (drives the customer timeline) |
| tasks | case_id, template_id, title, assignee_user_id, due_at, priority (p1, p2, p3), state (todo, doing, waiting_customer, waiting_partner, done), checklist jsonb |
| partners | name, kind (registered_agent, filing, tax_preparer, bank, ifza, bd_legal), country, contact |
| partner_prices | partner_id, product_id, state_code, currency, amount_minor, valid_from |
| name_change_requests | case_id, rejected_name, new_name, status |

## Documents and signatures

| Table | Key columns |
| --- | --- |
| files | storage_key, mime_type, size_bytes, sha256, uploaded_by, classification (kyc, company, finance, general) |
| documents | workspace_id, company_id, case_id, file_id, type, title, issued_on, visible_to_customer |
| signatures | person_id, image_file_id, captured_at, ip, user_agent |
| signed_documents | document_template_id, document_id, signature_id, signed_at |

## Compliance

| Table | Key columns |
| --- | --- |
| compliance_rules | jurisdiction_code, state_code, entity_type, conditions jsonb, obligation, anchor (formation_date, anniversary_month, fiscal_year_end, license_expiry, fixed_date), due_rule jsonb, government_fee_minor, penalty_text, authority, source_url, verified_on, verified_by, effective_from, effective_to, reminder_offsets int[] |
| compliance_overrides | rule_id, period, new_due_on, reason, source_url |
| compliance_events | company_id, rule_id, rule_version, period, due_on, state (upcoming, purchased, filed, handled_by_customer, missed, not_applicable), proof_document_id |

## Billing

| Table | Key columns |
| --- | --- |
| invoices | workspace_id, legal_entity_id, number (series per entity and currency), status, currency, totals, due_on, pay_link_token_hash |
| invoice_lines | invoice_id, order_line_id, description, amounts |
| payments | invoice_id, payment_channel_id, provider_reference, gross_minor, fee_minor, net_minor, currency, fx_rate_to_usd, received_at, proof_file_id |
| credit_notes | invoice_id, amount_minor, reason |
| refunds | payment_id, amount_minor, reason_code, approval_id, status, provider_reference |
| renewals | company_id, product_id, period_start, period_end, invoice_id, state, reminder_stage |
| subscriptions | workspace_id, product_id, price_id, status, current_period_end, auto_renew |
| entitlements | workspace_id, company_id, product_id, starts_at, ends_at, source |

## Ledger

| Table | Key columns |
| --- | --- |
| legal_entities | name (Rocket Wave Inc, Bangladesh proprietorship), country, base_currency |
| ledger_accounts | legal_entity_id, code, name, kind (asset, liability, income, expense) |
| ledger_entries | legal_entity_id, occurred_on, memo, source_type, source_id, reversed_entry_id (append-only) |
| ledger_lines | entry_id, account_id, debit_minor, credit_minor, currency, fx_rate_to_usd, order_id |
| partner_payouts | partner_id, case_id (required), channel (paypal, worldfirst, mollie, bank), amount_sent_minor, fee_minor, fx_rate, amount_received_minor, transaction_id, legal_entity_id |
| monthly_inputs | month, kind (marketing_spend, expense), category, channel, amount_minor, currency, legal_entity_id |
| bank_statement_lines | settlement_account_id, posted_on, amount_minor, reference, matched_entry_id |
| month_closes | legal_entity_id, month, closed_by, closed_at |

## Rewards, support, notifications and the rest

| Table | Key columns |
| --- | --- |
| wallet_transactions | workspace_id, amount_minor, currency, reason (referral, refund, goodwill, promotion, spend, topup), issued_by, source_id |
| referrals | referrer_workspace_id, referred_workspace_id, status, qualifying_order_id, credited_at |
| reward_offers, reward_claims | partner perks and each claim click |
| affiliate_commissions | partner_name, tier, period, expected_minor, received_minor, ledger_entry_id |
| tickets, ticket_messages | workspace_id, order_id, subject, status, priority; messages with internal flag |
| help_articles | slug, title, body, tags |
| notification_templates | key, channel, subject, body |
| outbox_events | type, payload jsonb, status, attempts, available_at |
| notifications | user_id, template_key, channel, status, sent_at, read_at |
| notification_preferences | user_id, channel, category, enabled |
| webhook_events | provider, external_id (unique per provider), signature_valid, payload jsonb, processed_at, error |
| mail_items | company_id, received_on, sender, scan_file_id, status, forward_request |
| policy_acceptances | user_id, policy (terms, privacy, refund), version, accepted_at |
| saved_views | user_id, list_key, name, filters jsonb, shared |
| integration_settings | provider, environment, config_enc, active |
| metric_snapshots | metric_key, period, value_numeric, breakdown jsonb |
| retention_jobs | workspace_id, stage (notice, export, archive, delete), scheduled_for, done_at |
