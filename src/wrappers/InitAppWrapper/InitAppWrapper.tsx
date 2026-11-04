'use client';
import { config } from '@/initConfig';
import { initAppSingleton } from './helpers';
import { PropsWithChildren, useEffect, useState } from 'react';

let isInitializing = false;

if (typeof window !== 'undefined') {
  // Suppress empty object {} console errors often thrown by WalletConnect/xPortal/sdk-dapp
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const isEmptyErrorArg = (val: unknown): boolean => {
      if (val === undefined || val === null) return true;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' || trimmed === '{}';
      }
      if (typeof val !== 'object') return false;
      if (val instanceof Error) {
        return !val.message || val.message.trim() === '' || val.message.trim() === '{}';
      }
      if (Object.keys(val).length === 0) return true;
      try {
        if (JSON.stringify(val) === '{}') return true;
      } catch {
        // Ignore circular references
      }
      return false;
    };

    if (args.length === 0 || args.every(isEmptyErrorArg)) {
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
