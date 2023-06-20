import type { AccountInterface } from "starknet";

import type { ARFError } from "../ARFError";
import type { PoolState, TokenState } from "../WalletBaseProvider";

export interface AddLiquidityQuoteState {
  loading: boolean;
  pool?: PoolState;
  amountToken0: string;
  amountToken1: string;
  estimatedLPReceived: string;
  token0?: TokenState;
  token1?: TokenState;
  // TODO generalisation with SwapQuoteState
  rateToken0Token1: number;
  rateToken1Token0: number;
  poolShare: number;
  slippage: number;
  isFirstAmountUpdated: boolean;
  isFirstDeposit: boolean;
  error?: ARFError;
}

export interface RemoveLiquidityQuoteState {
  loading: boolean;
  pool?: PoolState;
  amountLPToken: string;
  minToken0Received: string;
  minToken1Received: string;
  slippage: number;
  error?: ARFError;
}

export interface LiquidityManagerState {
  pools: PoolState[];
  currentAddLiquidityQuote?: AddLiquidityQuoteState;
  currentRemoveLiquidityQuote?: RemoveLiquidityQuoteState;
  getAllPools: () => void;
  getReserves: (pool: PoolState) => Promise<PoolState>;
  getLPBalance: (pool: PoolState, account: AccountInterface) => void;
  getLPBalanceForAll: (pools: PoolState[], account: AccountInterface) => void;
  getPoolFromTokens: (token0: TokenState, token1: TokenState) => PoolState | undefined;
  addLiquidity: (addLiquidityQuote: AddLiquidityQuoteState, account: AccountInterface) => void;
  removeLiquidity: (removeLiquidityQuote: RemoveLiquidityQuoteState, account: AccountInterface) => void;
  updateAddLiquidityQuote: (
    token0: TokenState | undefined,
    token1: TokenState | undefined,
    amountToken0: string,
    amountToken1: string,
    isFirstAmountUpdated: boolean,
    slippage: number
  ) => void;
  updateRemoveLiquidityQuote: (pool: PoolState, amountLPToken: string, slippage: number) => void;
}

export const POOL_STATE_INITIAL_STATE: LiquidityManagerState = {
  pools: [],
  currentAddLiquidityQuote: undefined,
  currentRemoveLiquidityQuote: undefined,
  getAllPools: () => undefined,
  getReserves: () =>
    Promise.resolve({
      address: "0x0",
      name: "",
      symbol: "",
      decimals: 0,
      totalSupply: { low: "0", high: "0" },
      token0: {
        address: "0x0",
        allowance: "0",
        balance: "0",
        chainId: -1,
        decimals: 0,
        logoURI: "",
        name: "",
        symbol: "",
        isApproving: false,
      },
      token1: {
        address: "0x0",
        allowance: "0",
        balance: "0",
        chainId: -1,
        decimals: 0,
        logoURI: "",
        name: "",
        symbol: "",
        isApproving: false,
      },
      balance: "0",
      allowance: "0",
      liquidityUSD: "0",
      volumeUSD_24: "0",
      feesUSD_24: "0",
      reserveToken0: { low: "0", high: "0" },
      reserveToken1: { low: "0", high: "0" },
      token0AmountPooled: "0",
      token1AmountPooled: "0",
      poolShare: 0,
      lastUpdate: undefined,
    }),
  getLPBalance: () => undefined,
  getLPBalanceForAll: () => undefined,
  getPoolFromTokens: () => undefined,
  addLiquidity: () => undefined,
  removeLiquidity: () => undefined,
  updateAddLiquidityQuote: () => undefined,
  updateRemoveLiquidityQuote: () => undefined,
};
