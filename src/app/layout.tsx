/* =====================================================
   🥓 BACON WALLET - Root Layout
   ===================================================== */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MvxProvider } from '@/contexts/MvxProvider';
import { NFTsProvider } from '@/contexts/NFTsContext';
import { FoldersProvider } from '@/contexts/FoldersContext';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Bacon Wallet | NFT Portfolio Manager for MultiversX',
  description: 'Organize your NFT collection with smart folders. The crispy way to manage your MultiversX assets.',
  keywords: ['NFT', 'MultiversX', 'Wallet', 'ESDT', 'Crypto', 'Web3', 'Portfolio'],
  authors: [{ name: 'Bacon Team' }],
  openGraph: {
    title: 'Bacon Wallet',
    description: 'Your portfolio is looking crispy today 🥓',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bacon Wallet',
    description: 'Your portfolio is looking crispy today 🥓',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D0B0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <MvxProvider>
          <NFTsProvider>
            <FoldersProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </FoldersProvider>
          </NFTsProvider>
        </MvxProvider>
      </body>
    </html>
  );
}
