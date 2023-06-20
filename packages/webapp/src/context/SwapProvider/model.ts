import type { AccountInterface } from "starknet";

import type { ARFError } from "../ARFError";
import type { TokenState } from "../WalletBaseProvider";

export interface SwapQuoteState {
  loading: boolean;
  slippage: number;
  amountTokenFrom: string;
  amountTokenTo: string;
  tokenFrom?: TokenState;
  tokenTo?: TokenState;
  rateToken0Token1: number;
  rateToken1Token0: number;
  minAmountReceived: string;
  priceImpact: number;
  lpFee: string;
  route: string;
  error?: ARFError;
}

export interface SwapState {
  currentSwapQuote?: SwapQuoteState;
  updateSwapQuote: (
    amountTokenFrom: string,
    tokenFrom: TokenState | undefined,
    tokenTo: TokenState | undefined,
    slippage: number
  ) => void;
  swap: (swapQuote: SwapQuoteState, account: AccountInterface) => void;
}

export const SWAP_STATE_INITIAL_STATE: SwapState = {
  currentSwapQuote: undefined,
  updateSwapQuote: () => undefined,
  swap: () => undefined,
};
