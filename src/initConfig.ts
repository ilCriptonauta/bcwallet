/* eslint-disable @typescript-eslint/no-explicit-any */
import './styles/globals.css';

import { InMemoryProvider } from './provider/inMemoryProvider';
import { walletConnectV2ProjectId } from './config/sharedConfig';
import { EnvironmentsEnum, ICustomProvider, InitAppType, ProviderType, ProviderTypeEnum, safeWindow } from './lib';

const ADDITIONAL_PROVIDERS = {
  inMemoryProvider: 'inMemoryProvider'
} as const;

export const ExtendedProviders = {
  ...ProviderTypeEnum,
  ...ADDITIONAL_PROVIDERS
} as const;

const DEFAULT_TOAST_LIEFTIME = 5000;

const providers: ICustomProvider<ProviderType>[] = [
  {
    name: ADDITIONAL_PROVIDERS.inMemoryProvider,
    type: ExtendedProviders.inMemoryProvider,
    constructor: async (options) => new InMemoryProvider(options)
  }
];

(safeWindow as any).multiversx = {};
(safeWindow as any).multiversx.providers = providers;

export const config: InitAppType = {
  storage: { getStorageCallback: () => sessionStorage },
  dAppConfig: {
    nativeAuth: true,
    environment: EnvironmentsEnum.mainnet,
    providers: {
      walletConnect: {
        walletConnectV2ProjectId
      }
    },
    transactionTracking: {
      successfulToastLifetime: DEFAULT_TOAST_LIEFTIME
    }
  }
};