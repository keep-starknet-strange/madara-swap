import type { AccountInterface, uint256 } from "starknet";

export interface TokenState {
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  balance: string;
}

export interface PoolState {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: uint256.Uint256;
  token0: TokenState;
  token1: TokenState;
  reserveToken0: uint256.Uint256;
  reserveToken1: uint256.Uint256;
  liquidityUSD: string;
  volumeUSD_24: string; // Volume in USD for last 24h
  feesUSD_24: string; // Fees in usd for last 24h
  balance: string; // User LP balance
  token0AmountPooled: string;
  token1AmountPooled: string;
  poolShare: number;
  lastBlockHash?: string;
}

export interface WalletBaseState {
  getBalance: (contract: TokenState | PoolState, account: AccountInterface) => Promise<any>;
}

export const WALLET_BASE_STATE_INITIAL_STATE: WalletBaseState = {
  getBalance: () => Promise.reject(),
};
