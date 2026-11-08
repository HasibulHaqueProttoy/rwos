'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Logo,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from '@rwos/ui';
import { useState } from 'react';

type ThemeChoice = 'system' | 'light' | 'dark';

// Sample rows only: generated names, no real customers.
const sampleOrders = [
  {
    id: 'RW-USD-2026-0001',
    company: 'Sample Ventures LLC',
    state: 'Wyoming',
    totalMinor: 30100,
    status: 'Paid',
  },
  {
    id: 'RW-USD-2026-0002',
    company: 'Example Trading Ltd',
    state: 'United Kingdom',
    totalMinor: 29900,
    status: 'Due soon',
  },
  {
    id: 'RW-USD-2026-0003',
    company: 'Demo Labs Inc',
    state: 'Delaware',
    totalMinor: 45000,
    status: 'Overdue',
  },
] as const;

const statusTone = { Paid: 'success', 'Due soon': 'warning', Overdue: 'danger' } as const;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function Showcase() {
  const [theme, setTheme] = useState<ThemeChoice>('system');

  function chooseTheme(choice: ThemeChoice) {
    setTheme(choice);
    if (choice === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', choice);
  }

  return (
    <main className="mx-auto flex max-w-content flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <h1 className="font-display text-h1">Design system</h1>
          <p className="text-body text-ink-muted">
            Shared components from @rwos/ui. Development only.
          </p>
        </div>
        <Tabs value={theme} onValueChange={(value) => chooseTheme(value as ThemeChoice)}>
          <TabsList aria-label="Theme">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            One primary action per screen. Brand only at checkout or upgrade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button>Register a company</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="brand">Pay now</Button>
          <Button variant="destructive">Delete</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button disabled>Disabled</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status badges</CardTitle>
          <CardDescription>Every badge carries a word, never colour alone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">Due soon</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge tone="info">In progress</Badge>
          <Badge tone="neutral">Draft</Badge>
          <Badge tone="brand">Recommended</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form fields</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input id="company-name" placeholder="Sample Ventures" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ein">EIN</Label>
            <Input
              id="ein"
              defaultValue="12-3456789"
              aria-invalid="true"
              aria-describedby="ein-error"
            />
            <p id="ein-error" className="text-caption text-danger">
              Enter an EIN in the format 12-3456789.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label id="state-label">Formation state</Label>
            <Select>
              <SelectTrigger aria-labelledby="state-label">
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WY">Wyoming</SelectItem>
                <SelectItem value="DE">Delaware</SelectItem>
                <SelectItem value="NM">New Mexico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="disabled-field">Disabled</Label>
            <Input id="disabled-field" disabled defaultValue="Not editable" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Sample orders (generated data).</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-data">{order.id}</TableCell>
                  <TableCell>{order.company}</TableCell>
                  <TableCell>{order.state}</TableCell>
                  <TableCell className="text-right">{usd.format(order.totalMinor / 100)}</TableCell>
                  <TableCell>
                    <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dialog, sheet and toast</CardTitle>
        </CardHeader>
        <CardFooter className="flex-wrap">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this order?</DialogTitle>
                <DialogDescription>
                  We will stop work on the filing. Government fees already paid are not refundable.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Keep order</Button>
                </DialogClose>
                <Button variant="destructive">Cancel order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Order details</SheetTitle>
                <SheetDescription>Sample Ventures LLC, Wyoming</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Button
            variant="secondary"
            onClick={() =>
              toast.success('Document uploaded', { description: 'Articles of Organization' })
            }
          >
            Show toast
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
