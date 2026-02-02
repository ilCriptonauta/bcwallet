'use client';

/* =====================================================
   🥓 BACON WALLET - Main Layout
   ===================================================== */

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={styles.layout}>
            <Header />
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <main
                className={`${styles.main} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}
            >
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
