/* eslint-disable @typescript-eslint/no-explicit-any */
import './styles/globals.css';

import { walletConnectV2ProjectId } from './config/sharedConfig';
import { EnvironmentsEnum, InitAppType } from './lib';

const DEFAULT_TOAST_LIEFTIME = 5000;

export const config: InitAppType = {
  storage: { getStorageCallback: () => localStorage },
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