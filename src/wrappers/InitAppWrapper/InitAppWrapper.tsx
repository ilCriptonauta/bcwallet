'use client';
import { config } from '@/initConfig';
import { initAppSingleton } from './helpers';
import { PropsWithChildren, useEffect, useState } from 'react';

let isInitializing = false;

if (typeof window !== 'undefined') {
  // Suppress empty object {} console errors often thrown by WalletConnect/xPortal
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && Object.keys(args[0]).length === 0) {
      return;
    }
    originalConsoleError(...args);
  };
}

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

    // Suppress unhandled rejections with empty objects or WalletConnect internal errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        typeof event.reason === 'object' &&
        Object.keys(event.reason).length === 0
      ) {
        event.preventDefault(); // prevents the Next.js overlay
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};
