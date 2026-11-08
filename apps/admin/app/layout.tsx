import type { Metadata } from 'next';
import { APP_NAME } from '@sabzi/shared/constants';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} Admin`,
  description: `Field team panel for the ${APP_NAME} pilot`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
