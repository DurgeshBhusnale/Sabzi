import type { Metadata } from 'next';
import { APP_NAME, PUBLIC_BASE_URL } from '@sabzi/shared/constants';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_BASE_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: 'Know the moment your sabziwala arrives. Follow the vendors who come to your society in Karve Nagar and Sus–Pashan, Pune.',
  icons: { icon: '/images/brand/favicon.png', apple: '/images/brand/app-icon.png' },
  openGraph: { images: [{ url: '/images/brand/og-share-card.png', width: 1200, height: 630 }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Figtree:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
