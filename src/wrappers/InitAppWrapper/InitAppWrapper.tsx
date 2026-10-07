'use client';
import { config } from '@/initConfig';
import { initAppSingleton } from './helpers';
import { PropsWithChildren, useEffect, useState } from 'react';

let isInitializing = false;

if (typeof window !== 'undefined') {
  // Suppress empty object {} console errors often thrown by WalletConnect/xPortal/sdk-dapp
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const isEmptyObject = (val: unknown): boolean => {
      if (typeof val !== 'object' || val === null) return false;
      if (val instanceof Error) {
        return !val.message && !val.stack;
      }
      return Object.keys(val).length === 0 && Object.getOwnPropertyNames(val).length === 0;
    };

    if (args.length === 0 || args.every(isEmptyObject)) {
      return; // Suppress empty object logging
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
