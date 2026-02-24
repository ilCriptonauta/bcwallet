'use client';
import { UnlockPanelManager, useGetLoginInfo } from '@/lib';
import { RouteNamesEnum } from '@/localConstants';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useMemo } from 'react';

export default function Unlock() {
  const router = useRouter();
  const { isLoggedIn } = useGetLoginInfo();

  const unlockPanelManager = useMemo(() => UnlockPanelManager.init({
    loginHandler: () => {
      router.push(RouteNamesEnum.home);
    },
    onClose: async () => {
      router.replace(RouteNamesEnum.home);
    }
  }), [router]);

  const handleOpenUnlockPanel = useCallback(() => {
    unlockPanelManager.openUnlockPanel();
  }, [unlockPanelManager]);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(RouteNamesEnum.home);
      return;
    }

    handleOpenUnlockPanel();
  }, [isLoggedIn, router, handleOpenUnlockPanel]);

  return null;
}
