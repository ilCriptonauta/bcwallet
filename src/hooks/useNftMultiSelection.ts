import { useState, useCallback } from 'react';
import { type NormalizedNft } from '@/helpers';

export function useNftMultiSelection() {
  const [selectedNfts, setSelectedNfts] = useState<NormalizedNft[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectNft = useCallback((nft: NormalizedNft) => {
    setSelectedNfts((prev) => {
      const exists = prev.some((item) => item.identifier === nft.identifier);
      if (exists) {
        const next = prev.filter((item) => item.identifier !== nft.identifier);
        if (next.length === 0) {
          setIsSelectionMode(false);
        }
        return next;
      } else {
        setIsSelectionMode(true);
        return [...prev, nft];
      }
    });
  }, []);

  const selectAll = useCallback((nfts: NormalizedNft[]) => {
    setSelectedNfts(nfts);
    setIsSelectionMode(nfts.length > 0);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNfts([]);
    setIsSelectionMode(false);
  }, []);

  const isSelected = useCallback(
    (identifier: string) => {
      return selectedNfts.some((item) => item.identifier === identifier);
    },
    [selectedNfts]
  );

  return {
    selectedNfts,
    setSelectedNfts,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelectNft,
    selectAll,
    clearSelection,
    isSelected,
  };
}
