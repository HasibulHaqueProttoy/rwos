import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Logo } from './logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { toast, Toaster } from './toast';

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('type', 'button');
  });

  it('can render a link with button styles', async () => {
    const { container } = render(
      <Button asChild variant="secondary">
        <a href="/orders">View orders</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'View orders' });
    expect(link.className).toContain('border-border-strong');
    await expectNoAxeViolations(container);
  });

  it('applies each variant', () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="brand">Pay now</Button>
        <Button variant="destructive">Delete</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Primary' }).className).toContain('bg-ink');
    expect(screen.getByRole('button', { name: 'Pay now' }).className).toContain('text-on-brand');
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-danger');
  });
});

describe('Badge', () => {
  it('always shows its status word', async () => {
    const { container } = render(<Badge tone="danger">Overdue</Badge>);
    expect(screen.getByText('Overdue').className).toContain('text-danger');
    await expectNoAxeViolations(container);
  });
});

describe('form fields', () => {
  it('a labelled input is accessible and marks errors', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="ein">EIN</Label>
        <Input id="ein" aria-invalid="true" aria-describedby="ein-error" />
        <p id="ein-error">Enter an EIN in the format 12-3456789.</p>
      </div>,
    );
    const input = screen.getByLabelText('EIN');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await expectNoAxeViolations(container);
  });

  it('a select opens, picks an option and shows it', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Label id="state-label">Formation state</Label>
        <Select>
          <SelectTrigger aria-labelledby="state-label">
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WY">Wyoming</SelectItem>
            <SelectItem value="DE">Delaware</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Formation state' });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Delaware' }));
    await waitFor(() => expect(trigger.textContent).toContain('Delaware'));
  });
});

describe('Card and Table', () => {
  it('render accessible structure', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Sample data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>RW-USD-2026-0001</TableCell>
                <TableCell>
                  <Badge tone="success">Paid</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>,
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByRole('table').className).toContain('tabular-nums');
    await expectNoAxeViolations(container);
  });
});

describe('Dialog', () => {
  it('opens with focus inside, has a name, and closes on Escape returning focus', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Cancel order</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>Government fees already paid are not refundable.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Cancel order' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this order?' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole('button', { name: 'Close' })).toBeDefined();
    await expectNoAxeViolations(dialog);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Sheet', () => {
  it('opens from the chosen side and closes with its Close button', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Details</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Order details</SheetTitle>
          <SheetDescription>Sample Ventures LLC</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const sheet = await screen.findByRole('dialog', { name: 'Order details' });
    expect(sheet.className).toContain('bottom-0');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Tabs', () => {
  it('switch with the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="open">
        <TabsList aria-label="Orders">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
        <TabsContent value="open">Open orders</TabsContent>
        <TabsContent value="done">Done orders</TabsContent>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: 'Open' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Done' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('Done orders');
  });
});

describe('Toast', () => {
  it('shows the message in words', async () => {
    render(<Toaster />);
    toast.success('Document uploaded', { description: 'Articles of Organization' });
    expect(await screen.findByText('Document uploaded')).toBeDefined();
    expect(screen.getByText('Articles of Organization')).toBeDefined();
  });
});

describe('Logo', () => {
  it('has an accessible name, or none when decorative', () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByRole('img', { name: 'Rocket Wave' })).toBeDefined();
    rerender(<Logo title="" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('uses the logo colour variables, all white when asked', () => {
    const { container, rerender } = render(<Logo />);
    const fills = () => [...container.querySelectorAll('path')].map((path) => path.style.fill);
    expect(new Set(fills())).toEqual(
      new Set(['var(--rw-logo-wordmark)', 'var(--rw-logo-rocket)', 'var(--rw-logo-flame)']),
    );
    rerender(<Logo tone="white" />);
    expect(new Set(fills())).toEqual(new Set(['var(--rw-logo-white)']));
  });
});
