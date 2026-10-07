import React from 'react';
import { PartyPopper, X } from 'lucide-react';
import { Badge } from '@/hooks/useVaultAssets';

interface BadgeUnlockModalProps {
  badges: Badge[];
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badges, onClose }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#121212] border border-orange-500/30 rounded-3xl p-6 shadow-2xl shadow-orange-500/10 text-center animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 border border-orange-500/40 flex items-center justify-center">
          <PartyPopper className="w-8 h-8 text-orange-400 animate-bounce" />
        </div>

        <h3 className="text-2xl font-black text-white mb-1">Badge Unlocked!</h3>
        <p className="text-xs font-semibold text-white/50 mb-6">
          Congratulations! You have achieved new milestones in the OnionX ecosystem.
        </p>

        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r ${badge.colorClass} border text-left`}
            >
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
                {badge.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{badge.title}</h4>
                <p className="text-[11px] font-medium text-white/70 line-clamp-1">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};
