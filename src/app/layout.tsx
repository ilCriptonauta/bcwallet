import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import './globals.css';
import { InitAppWrapper } from '../wrappers/InitAppWrapper/InitAppWrapper';
import { Suspense } from 'react';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Bacon Wallet - Let's Cook NFTs",
  description: 'The ultimate hub to manage and create your digital Collectibles on MultiversX.',
  applicationName: 'Bacon Wallet',
  openGraph: {
    type: 'website',
    siteName: 'Bacon',
    title: "Bacon Wallet - Let's Cook NFTs",
    description: 'The ultimate hub to manage and create your digital Collectibles on MultiversX.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bacon Wallet - Let's Cook NFTs",
    description: "The ultimate hub to manage and create your digital Collectibles on MultiversX.",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Previene lo zoom fastidioso su input in iOS
  userScalable: false, // In combinazione con maximumScale=1 è essenziale
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' }, // slate-50
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0e' },  // dark bg
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${plusJakarta.variable} dark`}>
      <body className="antialiased selection:bg-brand-orange/30 min-h-screen bg-slate-50 dark:bg-[#0c0c0e]">
        <InitAppWrapper>
          <Suspense>
            {children}
          </Suspense>
        </InitAppWrapper>
      </body>
    </html>
  );
}
