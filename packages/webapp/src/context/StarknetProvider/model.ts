import type { AccountInterface, ProviderInterface } from "starknet";
import { defaultProvider } from "starknet";

import type { TokenState } from "../WalletBaseProvider";

export interface StarknetState {
  account?: AccountInterface;
  connected?: boolean;
  chainId: number;
  connectBrowserWallet: () => void;
  disconnectBrowserWallet: () => void;
  requestWatchAsset: (token: TokenState) => void;
  setConnected: (con: boolean) => void;
  provider: ProviderInterface;
}

export const STARKNET_STATE_INITIAL_STATE: StarknetState = {
  account: undefined,
  connected: false,
  chainId: 0,
  connectBrowserWallet: () => undefined,
  disconnectBrowserWallet: () => undefined,
  requestWatchAsset: () => undefined,
  setConnected: () => undefined,
  provider: defaultProvider,
};
