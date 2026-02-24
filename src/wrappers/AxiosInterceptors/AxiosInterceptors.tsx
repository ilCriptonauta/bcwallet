'use client';
import { PropsWithChildren, useEffect } from 'react';
import { useGetLoginInfo, setAxiosInterceptors } from '@/lib';
import { sampleAuthenticatedDomains } from '@/config/config.mainnet';

export const AxiosInterceptors = ({ children }: PropsWithChildren) => {
  const { tokenLogin } = useGetLoginInfo();

  useEffect(() => {
    setAxiosInterceptors({
      authenticatedDomains: sampleAuthenticatedDomains,
      bearerToken: tokenLogin?.nativeAuthToken
    });
  }, [tokenLogin?.nativeAuthToken]);

  return <>{children}</>;
};
