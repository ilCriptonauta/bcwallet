import React, { useState } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  Coins, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BarChart3,
  Sparkles,
  Box,
  Folder,
  X
} from 'lucide-react';
import { type PortfolioTrackerData } from '@/hooks/usePortfolioTracker';

interface PortfolioSummaryCardProps {
  portfolio: PortfolioTrackerData;
  onClose?: () => void;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({ portfolio, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    totalEgld,
    totalUsd,
    egldPriceUsd,
    nftCount = 0,
    sftCount = 0,
    isLoading,
    collectionStats,
    refresh
  } = portfolio;

  const formattedEgld = totalEgld.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedUsd = totalUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  const formattedEgldPrice = egldPriceUsd > 0
    ? `$${egldPriceUsd.toFixed(2)}`
    : '—';

  return (
    <div className="relative w-full rounded-[2.5rem] bg-gradient-to-br from-white/90 via-white/80 to-orange-500/5 dark:from-[#151518]/90 dark:via-[#121214]/80 dark:to-orange-500/10 border border-gray-200/80 dark:border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 group overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── PARTE 1: ESTIMATED VALUE ── */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Estimated NFT Value
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                OOX Floor Tracker
              </span>
              {egldPriceUsd > 0 && (
                <span className="text-[10px] font-bold text-gray-400">
                  1 EGLD = {formattedEgldPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 text-gray-400 hover:text-orange-500 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Floor Prices"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all active:scale-95"
              title="Close Value Section"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Value Display */}
      <div className="relative z-10 mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-900 to-gray-600 dark:from-white dark:via-white dark:to-white/60 tracking-tight">
            {isLoading ? '...' : formattedEgld}
          </span>
          <span className="text-xl font-black text-orange-500">EGLD</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-base font-bold text-gray-600 dark:text-white/60">
            {isLoading ? 'Calculating...' : formattedUsd}
          </span>
        </div>
      </div>

      {/* ── PARTE 2: STATS (ESPANDIBILE - DEFAULT NASCOSTA) ── */}
      <div className="relative z-10 pt-4 border-t border-gray-200/60 dark:border-white/10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-black tracking-widest text-gray-900 dark:text-white">Stats</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {nftCount} NFTs
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {sftCount} SFTs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold">{isExpanded ? 'Nascondi' : 'Espandi'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dynamic Expandable Content */}
        {isExpanded && (
          <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">NFTs</span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">{nftCount}</span>
                <span className="text-[9px] text-gray-400 font-medium">Non-Fungible Tokens</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">SFTs</span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">{sftCount}</span>
                <span className="text-[9px] text-gray-400 font-medium">Semi-Fungible Tokens</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-yellow-500 mb-1">
                  <Folder className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Collections</span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">{collectionStats.length}</span>
                <span className="text-[9px] text-gray-400 font-medium">Unique Collections</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <Box className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Assets</span>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white">{nftCount + sftCount}</span>
                <span className="text-[9px] text-gray-400 font-medium">Items Owned</span>
              </div>
            </div>

            {/* Collection Breakdown List */}
            {collectionStats.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mb-2">
                  Collection Breakdown ({collectionStats.length})
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
                  {collectionStats.map((stat) => {
                    const floorPriceText = stat.floorEgld > 0
                      ? `${stat.floorEgld.toFixed(2)} EGLD`
                      : 'No Active Listing';

                    const totalValText = stat.totalEgld > 0
                      ? `${stat.totalEgld.toFixed(2)} EGLD`
                      : '—';

                    return (
                      <div
                        key={stat.collection}
                        className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-orange-500/30 transition-all text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black dark:text-white truncate">
                              {stat.collectionName}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-200/60 dark:bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                              {stat.count}x
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                            Floor: <span className="text-orange-500 font-bold">{floorPriceText}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block font-black text-gray-900 dark:text-white">
                            {totalValText}
                          </span>
                          {stat.totalUsd > 0 && (
                            <span className="block text-[10px] font-bold text-gray-400">
                              ${stat.totalUsd.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
