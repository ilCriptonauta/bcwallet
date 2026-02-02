'use client';

/* =====================================================
   🥓 BACON WALLET - Main Layout
   ===================================================== */

import { useState } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/out/react/account/useGetAccount';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { address } = useGetAccount();

    const MOCK_ADDRESS = 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In dev, we use mock address unless real address is connected
    const effectiveAddress = address || (isDevelopment ? MOCK_ADDRESS : null);

    // Sidebar visibility: show if we're "logged in" (real or mock)
    const showSidebar = Boolean(effectiveAddress);

    // For centring purposes, we check if the sidebar is actually being shown
    // If not, we use full-width mode.
    const isFullWidth = !showSidebar;

    return (
        <div className={styles.layout}>
            <Header />
            {showSidebar && (
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            )}
            <main
                className={`
                    ${styles.main} 
                    ${showSidebar && isSidebarCollapsed ? styles.sidebarCollapsed : ''} 
                    ${isFullWidth ? styles.fullWidth : ''}
                `}
            >
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
