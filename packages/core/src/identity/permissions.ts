/*
 * The permissions code can check. Code always checks a permission key, never a role name
 * (SECURITY.md). Which role holds which permission is data in role_permissions, seeded from
 * roles.ts and edited in the admin afterwards.
 *
 * Adding a key: add it here with a description and, if a role should have it by default,
 * to roles.ts. The next seed adds it to the database and grants it to those roles.
 */
export const permissionCatalog = {
  // Staff and access
  'staff.read': 'See staff members and their roles',
  'staff.manage': 'Create, deactivate and change the role of staff members',
  'roles.manage': 'Change which permissions each role has',
  'audit.read': 'Read the audit log',
  'settings.manage': 'Change integration settings, templates and other admin settings',

  // Sales
  'leads.read': 'See leads and the sales pipeline',
  'leads.manage': 'Create and update leads and follow-ups',
  'quotes.read': 'See quotes',
  'quotes.manage': 'Create, send and convert quotes',

  // Customers and orders
  'customers.read': 'See customers, companies and their status',
  'customers.manage': 'Edit customer and company details',
  'customers.view_as': 'View the customer app as a customer sees it (read-only, every use logged)',
  'orders.read': 'See orders',
  'orders.manage': 'Create and update orders',

  // Cases and work
  'cases.read_all': 'See every case',
  'cases.read_assigned': 'See only the cases assigned to them',
  'cases.assign': 'Assign cases to staff and partners',
  'cases.manage': 'Change the status and details of cases they can see',
  'tasks.manage': 'Work on tasks of cases they can see',

  // Identity documents and other documents
  'kyc.read': 'View identity documents (every view logged)',
  'kyc.review': 'Approve or reject identity documents',
  'documents.read': 'See company and case documents',
  'documents.upload': 'Upload documents to cases they can see',
  'documents.manage': 'Edit, replace and share documents',

  // Compliance
  'compliance.read': 'See compliance calendars and events',
  'compliance.manage': 'Update compliance events (filed, missed, not applicable)',
  'compliance_rules.manage': 'Edit compliance rules, sources and overrides',

  // Catalogue and pricing
  'catalog.read': 'See products, prices and government fees',
  'prices.manage': 'Change prices, government fees and payment channels',
  'discounts.propose': 'Give or propose discounts within the approval tiers',
  'discounts.approve': 'Approve discounts above the sales limit',

  // Money
  'refunds.request': 'Open a refund request',
  'refunds.approve': 'Give final approval to a refund',
  'refunds.pay': 'Pay out an approved refund',
  'invoices.read': 'See invoices and payment status',
  'invoices.manage': 'Create and send invoices and credit notes',
  'payments.record': 'Record payments, including manual payments with proof',
  'payouts.read': 'See partner payouts',
  'payouts.manage': 'Record partner payouts',
  'payout_recipients.approve': 'Approve a new payout recipient',
  'ledger.read': 'See the money ledger',
  'ledger.manage': 'Post ledger entries, reconcile and close months',
  'expenses.manage': 'Enter monthly marketing spend and expenses',
  'reports.read': 'See finance reports',
  'metrics.read': 'See the business metrics dashboard',

  // Support and partners
  'tickets.read': 'See support tickets',
  'tickets.manage': 'Reply to and close support tickets',
  'partners.read': 'See partners and their prices',
  'partners.manage': 'Create partners and edit their prices',
} as const satisfies Record<string, string>;

export type Permission = keyof typeof permissionCatalog;

export const permissionKeys = Object.keys(permissionCatalog) as Permission[];

export function isPermission(value: string): value is Permission {
  return Object.hasOwn(permissionCatalog, value);
}
