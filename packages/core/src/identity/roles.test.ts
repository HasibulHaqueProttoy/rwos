import { describe, expect, it } from 'vitest';
import { isPermission, type Permission, permissionCatalog, permissionKeys } from './permissions';
import { defaultRoles } from './roles';

const role = (key: string) => {
  const found = defaultRoles.find((candidate) => candidate.key === key);
  if (!found) throw new Error(`No role ${key}`);
  return new Set<Permission>(found.permissions);
};
const holders = (permission: Permission) =>
  defaultRoles
    .filter((candidate) => candidate.permissions.includes(permission))
    .map((candidate) => candidate.key);

describe('permission catalogue', () => {
  it('uses resource.action keys, each with a description', () => {
    for (const key of permissionKeys) {
      expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
      expect(permissionCatalog[key].split(' ').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('recognises only catalogue keys', () => {
    expect(isPermission('ledger.read')).toBe(true);
    expect(isPermission('ledger.delete')).toBe(false);
    expect(isPermission('toString')).toBe(false);
  });
});

describe('default roles', () => {
  it('are the six roles from the build plan', () => {
    expect(defaultRoles.map((candidate) => candidate.key)).toEqual([
      'founder',
      'sales',
      'operations',
      'finance',
      'support',
      'partner',
    ]);
  });

  it('only use catalogue keys, without duplicates', () => {
    for (const candidate of defaultRoles) {
      for (const permission of candidate.permissions)
        expect(isPermission(permission), permission).toBe(true);
      expect(new Set(candidate.permissions).size).toBe(candidate.permissions.length);
    }
  });

  it('founder has every permission', () => {
    expect(role('founder')).toEqual(new Set(permissionKeys));
  });
});

// The product spec's role table (docs/PRD.md and the spec's "User management and permissions").
describe('the spec role table', () => {
  const money: Permission[] = [
    'ledger.read',
    'ledger.manage',
    'expenses.manage',
    'payouts.read',
    'payouts.manage',
    'invoices.manage',
    'payments.record',
    'reports.read',
  ];

  it('sales: no ledger, expenses, identity documents or price changes', () => {
    const sales = role('sales');
    for (const permission of [
      ...money,
      'kyc.read',
      'kyc.review',
      'prices.manage',
    ] as Permission[]) {
      expect(sales.has(permission), permission).toBe(false);
    }
    expect(sales.has('discounts.propose')).toBe(true);
    expect(sales.has('refunds.request')).toBe(true);
  });

  it('operations: no finance, metrics or prices', () => {
    const operations = role('operations');
    for (const permission of [
      ...money,
      'invoices.read',
      'metrics.read',
      'prices.manage',
    ] as Permission[]) {
      expect(operations.has(permission), permission).toBe(false);
    }
    expect(operations.has('kyc.review')).toBe(true);
  });

  it('finance: cannot change prices or staff', () => {
    const finance = role('finance');
    for (const permission of ['prices.manage', 'staff.manage', 'roles.manage'] as Permission[]) {
      expect(finance.has(permission), permission).toBe(false);
    }
    expect(finance.has('ledger.manage')).toBe(true);
  });

  it('support: no identity documents or finance', () => {
    const support = role('support');
    for (const permission of [
      ...money,
      'invoices.read',
      'kyc.read',
      'kyc.review',
    ] as Permission[]) {
      expect(support.has(permission), permission).toBe(false);
    }
  });

  it('partner: only their assigned cases and uploading documents', () => {
    expect(role('partner')).toEqual(new Set(['cases.read_assigned', 'documents.upload']));
  });

  it('only founders approve refunds, discounts above the limit, payout recipients, prices, staff and roles', () => {
    for (const permission of [
      'refunds.approve',
      'discounts.approve',
      'payout_recipients.approve',
      'prices.manage',
      'staff.manage',
      'roles.manage',
    ] as Permission[]) {
      expect(holders(permission), permission).toEqual(['founder']);
    }
  });
});

// Decisions of 8 November 2026 (recorded in roles.ts and decision 0008).
describe('decisions on unclear points', () => {
  it('operations see only cases assigned to them; only founders see every case and assign', () => {
    expect(role('operations').has('cases.read_assigned')).toBe(true);
    expect(holders('cases.read_all')).toEqual(['founder']);
    expect(holders('cases.assign')).toEqual(['founder']);
  });

  it('sales see invoice and payment status, read-only', () => {
    expect(role('sales').has('invoices.read')).toBe(true);
    expect(role('sales').has('invoices.manage')).toBe(false);
  });

  it('founders and operations edit compliance rules', () => {
    expect(holders('compliance_rules.manage')).toEqual(['founder', 'operations']);
  });

  it('support and founders may view as a customer', () => {
    expect(holders('customers.view_as')).toEqual(['founder', 'support']);
  });
});
