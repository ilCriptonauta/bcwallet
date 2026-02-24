'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetAccountInfo } from '@/lib';
import { API_URL } from '@/config/config.mainnet';
import BigNumber from 'bignumber.js';

export const useOnxBalance = () => {
    const { address } = useGetAccountInfo();
    const [balance, setBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setBalance('0');
            return;
        }

        const fetchBalance = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/accounts/${address}/tokens/ONX-3e51c8`);
                const tokenData = response.data;

                if (tokenData && tokenData.balance) {
                    const decimals = tokenData.decimals ?? 18;
                    const BigBalance = new BigNumber(tokenData.balance).dividedBy(new BigNumber(10).pow(decimals));
                    // Show balance without decimals (integer part)
                    setBalance(BigBalance.integerValue(BigNumber.ROUND_FLOOR).toString());
                } else {
                    setBalance('0');
                }
            } catch {
                // If token not found or error, default to 0
                setBalance('0');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
    }, [address]);

    return { balance, isLoading };
};
