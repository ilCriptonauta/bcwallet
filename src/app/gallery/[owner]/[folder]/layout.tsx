import type { Metadata } from 'next';

interface GalleryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ owner: string; folder: string }>;
}

export async function generateMetadata({ params }: GalleryLayoutProps): Promise<Metadata> {
  const { owner, folder } = await params;
  const rawFolderName = decodeURIComponent(folder).replace(/-/g, ' ');
  const folderName = rawFolderName.charAt(0).toUpperCase() + rawFolderName.slice(1);
  const displayOwner = owner.startsWith('erd1') 
    ? `${owner.slice(0, 8)}...${owner.slice(-4)}` 
    : owner.startsWith('@') ? owner : `@${owner}`;

  const title = `${folderName} Collection — ${displayOwner}`;
  const description = `Explore the curated ${folderName} NFT gallery on Bacon Wallet created by ${displayOwner}. Powered by MultiversX.`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Bacon Wallet',
      title,
      description,
      images: [
        {
          url: '/social.jpg',
          width: 1200,
          height: 630,
          alt: `${folderName} Gallery by ${displayOwner}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@onionxlabs',
      images: ['/social.jpg'],
    },
  };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
