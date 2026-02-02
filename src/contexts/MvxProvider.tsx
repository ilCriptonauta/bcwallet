'use client';

/* =====================================================
   🥓 BACON WALLET - MultiversX DApp Provider
   Temporary simplified version for development
   ===================================================== */

import { ReactNode, useEffect, useState } from 'react';
import { initApp } from '@multiversx/sdk-dapp/out/methods/initApp/initApp';
import { EnvironmentsEnum } from '@multiversx/sdk-dapp/out/types/enums.types';
import { CONFIG, NETWORK_ENV } from '@/config/config';

interface MvxProviderProps {
    children: ReactNode;
}

export function MvxProvider({ children }: MvxProviderProps) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initApp({
                    storage: {
                        getStorageCallback: () => sessionStorage // Use sessionStorage for security
                    },
                    dAppConfig: {
                        environment: EnvironmentsEnum[NETWORK_ENV as keyof typeof EnvironmentsEnum],
                        nativeAuth: {
                            expirySeconds: 86400, // 24 hours
                            tokenExpirationToastWarningSeconds: 300 // 5 min warning
                        }
                    }
                });
                setInitialized(true);
            } catch (error) {
                console.error('Failed to initialize DApp:', error);
            }
        };

        initialize();
    }, []);

    // Show nothing or a loader until initialized
    if (!initialized) {
        return null;
    }

    return <>{children}</>;
}
