import { APP_NAME } from '@sabzi/shared/constants';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-xs p-md">
      <h1 className="font-heading text-3xl font-bold text-brand-leaf">{APP_NAME} Admin</h1>
      <p className="text-text-secondary">Field team panel. Sign in to continue.</p>
    </main>
  );
}
