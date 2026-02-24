'use client';
import { config } from '@/initConfig';
import { initAppSingleton } from './helpers';
import { PropsWithChildren, useEffect, useState } from 'react';

let isInitializing = false;

export const InitAppWrapper = ({ children }: PropsWithChildren) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeApp = async () => {
    if (isInitializing) {
      return;
    }
    isInitializing = true;
    try {
      await initAppSingleton(config);
      setIsInitialized(true);
    } catch (err: unknown) {
      console.error('Bacon Wallet: App Initialization Failed', err instanceof Error ? err.message : err);
    } finally {
      isInitializing = false;
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};
