import type { Metadata } from 'next';

interface GalleryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ owner: string; folder: string }>;
}

export async function generateMetadata({ params }: GalleryLayoutProps): Promise<Metadata> {
  const { owner, folder } = await params;
  const folderName = decodeURIComponent(folder).replace(/-/g, ' ');
  const displayOwner = owner.startsWith('erd1') ? `${owner.slice(0, 8)}...${owner.slice(-4)}` : `@${owner}`;

  return {
    title: `${folderName} — ${displayOwner}`,
    description: `Check out this NFT collection on Bacon Wallet by ${displayOwner}`,
    openGraph: {
      type: 'website',
      siteName: 'Bacon Wallet',
      title: `${folderName} — Gallery`,
      description: `Check out this NFT collection on Bacon Wallet by ${displayOwner}`,
      images: ['/social.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${folderName} — Gallery`,
      description: `Check out this NFT collection on Bacon Wallet by ${displayOwner}`,
      creator: '@onionxlabs',
      images: ['/social.jpg'],
    },
  };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
