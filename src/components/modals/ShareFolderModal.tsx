import React from 'react';
import { X, Share2, Copy, Check, ExternalLink } from 'lucide-react';

interface ShareFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToShare: { name: string } | null;
  accountInfo: any; // Using any or specific type if imported
  walletAddress: string | null;
  shareLinkCopied: boolean;
  setShareLinkCopied: (value: boolean) => void;
}

export const ShareFolderModal: React.FC<ShareFolderModalProps> = ({
  isOpen,
  onClose,
  folderToShare,
  accountInfo,
  walletAddress,
  shareLinkCopied,
  setShareLinkCopied,
}) => {
  if (!isOpen || !folderToShare) return null;

  const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const ownerSlug = accountInfo?.account?.username
    ? accountInfo.account.username.replace('.elrond', '')
    : walletAddress || '';
  const folderSlug = slugify(folderToShare.name);
  const shareUrl = `https://baconwallet.vercel.app/gallery/${ownerSlug}/${folderSlug}`;
  const shareText = `Check out my "${folderToShare.name}" NFT collection on Bacon Wallet 🥓`;
  
  // Need to ensure the URI doesn't error out if undefined
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 overscroll-contain" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] md:shadow-2xl border-t border-gray-100 dark:border-white/10 md:border p-8 md:p-10 animate-in slide-in-from-bottom-full md:zoom-in-95 md:slide-in-from-bottom-0 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-hide" style={{ touchAction: 'auto' }}>
        {/* Mobile Drag Indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Share2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">Share Folder</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{folderToShare.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* URL Display + Copy */}
        <div className="mb-6">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 mb-2 block">Gallery Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-700 dark:text-white/70 truncate select-all">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 p-3.5 rounded-2xl font-black text-sm transition-all active:scale-90 ${
                shareLinkCopied
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
              }`}
            >
              {shareLinkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-3 mb-6">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 block">Share on</label>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 bg-black dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              <span>Twitter / X</span>
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 bg-[#2AABEE] text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>

        {/* Preview Link */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/60 hover:text-orange-500 dark:hover:text-orange-500 font-black rounded-2xl hover:scale-[1.01] active:scale-95 transition-all text-sm border border-gray-200 dark:border-white/5 hover:border-orange-500/30"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Preview Gallery</span>
        </a>
      </div>
    </div>
  );
};
