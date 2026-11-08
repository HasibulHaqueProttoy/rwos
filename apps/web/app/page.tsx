import { Logo } from '@rwos/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-content flex-col justify-center gap-4 px-4 py-12">
      <Logo />
      <h1 className="font-display text-h1">Rocket Wave customer app</h1>
      <p className="text-body-lg text-ink-muted">
        The app is running. Screens arrive in later tasks.
      </p>
    </main>
  );
}
