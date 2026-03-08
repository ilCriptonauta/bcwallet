'use client';

import React, { useEffect, useState } from 'react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import PromoBanner from '@/components/PromoBanner';
import Splash from '@/components/Splash';
import TabSystem from '@/components/TabSystem';
import ToolsPage from '@/components/ToolsPage';
import LicensePage from '@/components/LicensePage';
import { useRouter } from 'next/navigation';
import { RouteNamesEnum } from '@/localConstants';
import { useGetIsLoggedIn, useGetAccountInfo, useGetNetworkConfig } from '@/lib';
import axios from 'axios';

type Page = 'home' | 'tools' | 'license';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else {
      // Respect system preference if no saved theme
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);
  const isLoggedIn = useGetIsLoggedIn();
  const accountInfo = useGetAccountInfo();
  const address = accountInfo?.address;
  const { network } = useGetNetworkConfig();
  const router = useRouter();
  const [isPro, setIsPro] = useState(false);
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [currentPage, setCurrentPage] = useState<Page>((searchParams.get('tab') as Page) || 'home');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', currentPage);
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentPage]);

  useEffect(() => {
    let active = true;

    const checkLicenses = async () => {
      if (!isLoggedIn || !address || !network?.apiAddress) return;

      try {
        const licenseCollections = ['BCNPASS-40e72d']; // Add more licensed collections here in the future

        for (const collection of licenseCollections) {
          const res = await axios.get(`${network.apiAddress}/accounts/${address}/nfts/count?collection=${collection}`);
          if (res.data > 0) {
            if (active) setIsPro(true);
            return; // Stop checking if at least one valid license is found
          }
        }
      } catch (error) {
        console.error("Failed to check licenses", error);
      }
    };

    checkLicenses();

    return () => {
      active = false;
    };
  }, [isLoggedIn, address, network?.apiAddress]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (!isLoggedIn) {
    return <Splash onLogin={() => router.push(RouteNamesEnum.unlock)} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col transition-colors duration-500 dark:bg-[#0c0c0e] bg-slate-50 text-slate-900 dark:text-white">
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        isLoggedIn={isLoggedIn}
        onLogin={() => router.push(RouteNamesEnum.unlock)}
        onLogout={() => router.push(RouteNamesEnum.logout)}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        isFullVersion={isPro}
      />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {currentPage === 'home' ? (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabSystem isFullVersion={isPro} />
            {!isPro && <PromoBanner onUpgrade={() => setIsPro(true)} />}
          </div>
        ) : currentPage === 'tools' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ToolsPage isFullVersion={isPro} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex justify-center">
            <LicensePage />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
