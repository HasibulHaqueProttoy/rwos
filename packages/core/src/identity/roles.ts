import { type Permission, permissionKeys } from './permissions';

/*
 * The six starting roles and their default permissions, from the product spec's role table
 * (docs/PRD.md) and the decisions of 8 November 2026:
 * - operations see only cases assigned to them (a founder assigns cases);
 * - sales may see invoice and payment status, read-only;
 * - founders and operations may edit compliance rules;
 * - support and founders may view the app as a customer (read-only, logged).
 *
 * These are defaults for a new database. After the first seed the admin edits role
 * permissions, and a later seed never undoes those edits.
 */
export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  permissions: readonly Permission[];
}

export const defaultRoles: readonly RoleDefinition[] = [
  {
    key: 'founder',
    name: 'Founder',
    description: 'Everything, including finance, metrics, prices, staff and permissions.',
    permissions: permissionKeys,
  },
  {
    key: 'sales',
    name: 'Sales',
    description:
      'Leads, quotes, customers and orders; discounts within the tiers; refund requests. No ledger, expenses, identity documents or price changes.',
    permissions: [
      'leads.read',
      'leads.manage',
      'quotes.read',
      'quotes.manage',
      'customers.read',
      'customers.manage',
      'orders.read',
      'orders.manage',
      'catalog.read',
      'discounts.propose',
      'refunds.request',
      'invoices.read',
      'tickets.read',
    ],
  },
  {
    key: 'operations',
    name: 'Operations',
    description:
      'Cases assigned to them and their tasks, identity document review, documents and compliance. No finance, metrics or prices.',
    permissions: [
      'cases.read_assigned',
      'cases.manage',
      'tasks.manage',
      'kyc.read',
      'kyc.review',
      'documents.read',
      'documents.upload',
      'documents.manage',
      'compliance.read',
      'compliance.manage',
      'compliance_rules.manage',
      'customers.read',
      'orders.read',
      'catalog.read',
      'partners.read',
      'tickets.read',
    ],
  },
  {
    key: 'finance',
    name: 'Finance',
    description:
      'Invoices, payments, payouts, ledger, expenses and reports; pays out approved refunds. Cannot change prices or staff.',
    permissions: [
      'invoices.read',
      'invoices.manage',
      'payments.record',
      'payouts.read',
      'payouts.manage',
      'ledger.read',
      'ledger.manage',
      'expenses.manage',
      'reports.read',
      'metrics.read',
      'refunds.pay',
      'customers.read',
      'orders.read',
      'catalog.read',
      'partners.read',
    ],
  },
  {
    key: 'support',
    name: 'Support',
    description:
      'Support tickets, customer status, read-only orders, view as customer. No identity documents or finance.',
    permissions: [
      'tickets.read',
      'tickets.manage',
      'customers.read',
      'customers.view_as',
      'orders.read',
      'catalog.read',
    ],
  },
  {
    key: 'partner',
    name: 'Partner',
    description:
      'External partner: only the cases assigned to them, and uploading documents to them.',
    permissions: ['cases.read_assigned', 'documents.upload'],
  },
];
