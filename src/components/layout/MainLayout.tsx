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

    // In development, we can simulate login with the provided mock account
    // In production, this will only be true if the user actually connects
    const MOCK_ADDRESS = 'erd1knr6ha4xat3juryp47x3duj4lykjhlxqhdu67vtj4ey9apy6aa5sg0hlem';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const effectiveAddress = address || (isDevelopment ? MOCK_ADDRESS : null);
    const isLoggedIn = Boolean(effectiveAddress);

    return (
        <div className={styles.layout}>
            <Header />
            {isLoggedIn && (
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            )}
            <main
                className={`${styles.main} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''} ${!isLoggedIn ? styles.fullWidth : ''}`}
            >
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
