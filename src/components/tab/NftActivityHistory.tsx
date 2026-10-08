'use client';

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useGetNetworkConfig } from '@/lib';

export const NftActivityHistory = ({ identifier }: { identifier: string }) => {
  const [activities, setActivities] = useState<{ type: 'list' | 'delist'; hash: string; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { network } = useGetNetworkConfig();

  useEffect(() => {
    let active = true;
    if (!identifier) return;

    fetch(`${network.apiAddress}/nfts/${identifier}/transactions?size=50`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data)) return;

        const filtered = data.map((tx: any) => {
          const fn = (tx.function || '').toLowerCase();
          const actionName = (tx.action?.name || '').toLowerCase();

          let type: 'list' | 'delist' | null = null;

          if (fn.includes('list') || fn.includes('sell') || actionName.includes('list') || actionName.includes('sell')) {
            type = 'list';
          } else if (fn.includes('withdraw') || fn.includes('delist') || fn.includes('cancel') || actionName.includes('withdraw') || actionName.includes('delist') || actionName.includes('cancel')) {
            type = 'delist';
          }

          return type ? { type, hash: tx.txHash, timestamp: tx.timestamp } : null;
        }).filter(Boolean) as { type: 'list' | 'delist'; hash: string; timestamp: number }[];

        // Remove duplicates and sort descending
        const unique = Array.from(new Map(filtered.map(item => [item.hash, item])).values())
          .sort((a, b) => b.timestamp - a.timestamp);

        setActivities(unique);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [identifier, network.apiAddress]);

  if (loading || activities.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] items-center flex gap-1.5 font-black uppercase tracking-[0.2em] text-gray-400">
        <Clock className="w-3 h-3" /> Trading Activity
      </h3>
      <div className="space-y-2">
        {activities.map((act) => (
          <a
            key={act.hash}
            href={`https://explorer.multiversx.com/transactions/${act.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 hover:border-orange-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              {act.type === 'list' ? (
                <div className="p-1.5 bg-green-500/10 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              ) : (
                <div className="p-1.5 bg-red-500/10 rounded-full">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${act.type === 'list' ? 'text-green-500' : 'text-red-500'}`}>
                {act.type === 'list' ? 'Listed' : 'Delisted'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              {new Date(act.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};
