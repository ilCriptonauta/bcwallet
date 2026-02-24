'use client';

import React, { useEffect, useState } from 'react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import PromoBanner from '@/components/PromoBanner';
import Splash from '@/components/Splash';
import TabSystem from '@/components/TabSystem';
import ToolsPage from '@/components/ToolsPage';
import { useRouter } from 'next/navigation';
import { RouteNamesEnum } from '@/localConstants';
import { useGetIsLoggedIn, useGetAccountInfo, useGetNetworkConfig } from '@/lib';
import axios from 'axios';

type Page = 'home' | 'tools';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const isLoggedIn = useGetIsLoggedIn();
  const accountInfo = useGetAccountInfo();
  const address = accountInfo?.address;
  const { network } = useGetNetworkConfig();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const checkLicenses = async () => {
      if (!isLoggedIn || !address || !network?.apiAddress) return;

      try {
        const licenseCollections = ['CHBONX-3e0201']; // Add more licensed collections here in the future

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
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  if (!isLoggedIn) {
    return <Splash onLogin={() => router.push(RouteNamesEnum.unlock)} />;
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 dark:bg-[#0c0c0e] bg-slate-50 text-slate-900 dark:text-white">
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
            <Hero />
            <TabSystem isFullVersion={isPro} />
            {!isPro && <PromoBanner onUpgrade={() => setIsPro(true)} />}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ToolsPage isFullVersion={isPro} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
