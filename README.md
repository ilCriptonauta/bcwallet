# Bacon Wallet

Bacon Wallet is visually stunning, robust, and custom-designed Web3 management Hub tailored for the MultiversX ecosystem, allowing users to intuitively view, manage, and create NFTs and SFTs.

## Objectives Achieved during the Iteration

This phase focused on refining the UI/UX to a premium standard, connecting with IPFS for decentralized storage, and resolving outstanding edge cases.

### 1. **IPFS Integration & Decentralized Uploads**
- **Architecture Secure-By-Design**: Integrated Pinata via a secure Next.js backend API route (`/api/upload`). The `PINATA_JWT` secret is never exposed to the client bundle, neutralizing the risk of key interception.
- **Automated Two-Step Minting Process**: Implemented a friction-less flow in the `ToolsPage` component.
  1. Image selected by the user is automatically uploaded to IPFS.
  2. A `metadata.json` standard file is generated encompassing all NFT information (attributes, name, royalties, etc.), and similarly uploaded to IPFS.
  3. The final `metadataCid` is linked to both `attributes` and `uris` in the final MultiVersX blockchain transaction, making the NFT fully standard-compliant on explorers and marketplaces.

### 2. **UI/UX Premium Polish**
- **Modal Image Fidelity (Aspect Ratios)**: Engineered an anti-cropping mechanism inside `pickOriginalImageUrl`. The dApp now bypasses the compressed thumbnails served by the MultiversX gateways, fetching the pure `nft.url` (the original image). The `NftMedia` component now dynamically scales the image respecting its native aspect ratio (portrait, landscape, square) using `object-contain` and padded bounding boxes without any distortion.
- **Dynamic Assets Loading**: Added mapping for animated files (`.mp4`, `.gif`) recognizing `mimeType` seamlessly alongside standard images.
- **Visual Fine-Tuning**: Polished alignments and letter-spacing compensations across various badges and labels (e.g. `Asset Hub`). 
- **Theming & Global Splash**: Generated standard Next.js `openGraph` and `twitter-cards` metadata utilizing `bacon-icon` images. Updated the main splash page replacing CSS shapes with the official vector-styled logo, and successfully injected standard favicons.
- **Port Conflicts**: Implemented graceful server restarting processes mitigating node conflict scenarios on standard 3000 ports.
 
### 3. **Smart Interaction & Multi-Selection**
- **Long Press Refinement**: Solved critical edge-cases during mobile long-press selection for multi-transfer operations (`send`, `list`, `burn`). Established robust timeout state management inside `TabSystem.tsx` preventing immediate deselection upon releasing the long press.

## Security Audit & Recommendations

The application has been actively evaluated for safety vulnerabilities, taking into account both standard Web2 vulnerabilities and Web3 specific implementations. Here are the immediate actionable security recommendations ranging from dependency management to App-layer architecture:

### 1. **Immediate Action: NPM Dependency Vulnerabilities**
- **The Issue**: An `npm audit` reveals severe vulnerabilities tied to underlying dependencies. Specifically, `Next.js < 15.5.9` possesses Image Optimizer RemotePatterns vulnerabilities that can lead to Denial of Service (DoS). Also, the `qs` package imported through `@multiversx/sdk-web-wallet-iframe-provider` possesses high-risk DoS vectors due to array limit bypasses. Minimatch possesses regular expression DoS risks.
- **Remediation**: 
  - Run `npm audit fix` to automatically patch non-breaking minor versions (specifically minimizing the `minimatch` and `next` DOS vulnerabilities).
  - *Warning on forced upgrades*: `npm audit fix --force` would downgrade `@multiversx/sdk-dapp` from `v5.6.2` to `v4.6.4` which will break the entire `useGetAccountInfo` ecosystem syntax. DO NOT force downgrade. Instead, leverage `npm overrides` or `npm resolutions` within `package.json` to safely force patch specifically `qs` underneath the MultiversX dependencies.

### 2. **API & Secrets Hardening**
- **The Issue**: The `/api/upload` endpoint currently accepts any file from any origin, making it susceptible to Pinata upload abuse by malicious actors running bots.
- **Remediation**: 
  - **Rate Limiting**: Implement Upstash or an in-memory rate limiter on the Next.js API route to cap the number of IPFS uploads per user.
  - **Authentication validation**: Since the user must be logged in via Web3 to mint, pass a signed message or simple JWT to the `/api/upload` endpoint to verify the user holds a valid EGLD address before letting them upload to your Pinata cloud.

### 3. **Content Security Policy (CSP) Optimization**
- **The Issue**: Image remote patterns in `next.config.mjs` are broadly open (e.g. wildcard `/**` on `media.elrond.com`, `ipfs.io`, etc.).
- **Remediation**: 
  - Restrict the `dangerouslyAllowSVG` protocol if you don't explicitly require rendering external SVGs.
  - The currently implemented inline CSP `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"` within image configs is a good start, but consider utilizing Next.js headers to implement a global restrictive CSP over the entire application.

### 4. **Smart Contract / Minter Payload Integrity**
- **The Issue**: In `ToolsPage.tsx`, transactions are constructed natively in the client and sent to the blockchain.
- **Remediation**:
  - Always validate the lengths of strings (like `assetForm.name`, `assetForm.collection`) before broadcasting. MultiversX transactions can fail unexpectedly and burn gas if naming conventions breach byte limits or contain unmapped characters.

### 5. **Environment & Deployment Integrity**
- Verify that `.env.local` containing `PINATA_JWT` is included in `.gitignore` (which typically is by default in Nextjs). Never push this to GitHub. Ensure production instances on Vercel/Netlify have these injected securely as Environment Variables.
