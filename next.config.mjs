/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurazione specifica per metadati social
  experimental: {
    optimizePackageImports: ['@multiversx/sdk-dapp', '@multiversx/sdk-dapp-ui'],
  },
  serverExternalPackages: ['@multiversx/sdk-core', '@multiversx/sdk-bls-wasm'],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.elrond.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.nftstorage.link',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.oox.art',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fevkctpkfn5okuuh.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      }
    ],
    // Ottimizzazioni per le immagini pesanti da IPFS
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache per 30 giorni
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  transpilePackages: [
    '@multiversx/sdk-dapp',
    '@multiversx/sdk-dapp-ui',
    '@multiversx/sdk-core',
    '@multiversx/sdk-bls-wasm'
  ],
  webpack: (config, { isServer }) => {
    config.cache = {
      type: 'memory',
    };
    config.resolve.alias['@'] = process.cwd();

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        buffer: false,
        net: false,
        tls: false,
        stream: false,
        url: false,
        crypto: false,
      };
    }

    config.externals.push(
      'pino-pretty',
      'lokijs',
      'encoding',
      {
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      }
    );

    return config;
  },
};

export default nextConfig;

