import type { AccountInterface } from "starknet";

import type {PoolState, TokenState} from "../WalletBaseProvider";

export interface WalletState {
  tokens: TokenState[];
  testTokens: TokenState[];
  freeMint: (tokensToMint: TokenState[], account: AccountInterface) => void;
  getTokenBalance: (token: TokenState, account: AccountInterface) => void;
  getTokenBalanceForAll: (tokens: TokenState[], account: AccountInterface) => void;
  migrateAllAssets: (
    tokensToMigrate: (TokenState | PoolState)[],
    account: AccountInterface,
    recipientAddress: string
  ) => void;
}

export const WALLET_STATE_INITIAL_STATE: WalletState = {
  tokens: [],
  testTokens: [],
  freeMint: () => undefined,
  getTokenBalance: () => undefined,
  getTokenBalanceForAll: () => undefined,
  migrateAllAssets: () => undefined,
};
