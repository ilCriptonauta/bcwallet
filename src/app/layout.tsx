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
  title: {
    default: "Bacon Wallet - Let's Cook NFTs",
    template: "%s | Bacon Wallet"
  },
  description: 'The ultimate hub to manage, create and experience your digital Collectibles on MultiversX.',
  applicationName: 'Bacon Wallet',
  authors: [{ name: 'OnionX Labs', url: 'https://x.com/onionxlabs' }],
  generator: 'Next.js',
  keywords: ['MultiversX', 'NFT', 'SFT', 'Wallet', 'Crypto', 'Web3', 'dApp', 'Bacon', 'OnionX'],
  creator: 'OnionX Labs',
  publisher: 'OnionX Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Bacon Wallet',
    title: "Bacon Wallet - Let's Cook NFTs",
    description: 'The ultimate hub to manage, create and experience your digital Collectibles on MultiversX.',
    locale: 'en_US',
    images: [{
      url: '/social.jpg', // The public application social sharing icon
      width: 1200,
      height: 630,
      alt: 'Bacon Wallet - MultiversX NFT Manager',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bacon Wallet - Let's Cook NFTs",
    description: "The ultimate hub to manage and create your digital Collectibles on MultiversX.",
    creator: '@onionxlabs',
    images: ['/social.jpg'],
  },
  appleWebApp: {
    capable: true,
    title: 'Bacon',
    statusBarStyle: 'black-translucent',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      <body className="antialiased selection:bg-brand-orange/30 min-h-[100dvh] bg-slate-50 dark:bg-[#0c0c0e]">
        <InitAppWrapper>
          <Suspense>
            {children}
          </Suspense>
        </InitAppWrapper>
      </body>
    </html>
  );
}
