import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Showcase } from './showcase';

export const metadata: Metadata = { title: 'Design system' };

/** Every shared component in both themes, for checking the UI during development. Not served in production. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Showcase />;
}
