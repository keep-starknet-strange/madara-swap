import type { Uint256 } from "starknet/utils/uint256";

import type { PoolState } from "../context/WalletBaseProvider";

import {
  formatBigNumberToReadableString,
  getLPReceived,
  getShareOfPool,
  getTokenEquivalenceFromReserve,
  isUint256Zero,
  parseReadableStringToBigNumber,
  toFixed,
  uint256ToBigNumber,
} from "./math";

export const addLiquidityQuote = (
  pool: PoolState,
  amountToken0: string,
  amountToken1: string,
  isFirstAmountUpdated: boolean,
  totalSupply: Uint256,
  reserveToken0: Uint256,
  reserveToken1: Uint256,
  slippage: number
) => {
  const { token0, token1 } = pool;
  let quotedAmountToken0 = amountToken0;
  let quotedAmountToken1 = amountToken1;
  const isFirstDeposit = isUint256Zero(reserveToken0) && isUint256Zero(reserveToken1);
  if (!isFirstDeposit) {
    quotedAmountToken0 = isFirstAmountUpdated ? amountToken0 : "";
    quotedAmountToken1 = isFirstAmountUpdated ? "" : amountToken1;
    // Parse input to BigNumbers
    const bnAmountToken0 = parseReadableStringToBigNumber(quotedAmountToken0, token0.decimals);
    const bnAmountToken1 = parseReadableStringToBigNumber(quotedAmountToken1, token1.decimals);

    if (!bnAmountToken0.isZero()) {
      // calculate addLiquidityQuote for token 1, base on token 0 input
      quotedAmountToken1 = getTokenEquivalenceFromReserve(
        bnAmountToken0,
        token1.decimals,
        reserveToken0,
        reserveToken1
      );
    } else if (!bnAmountToken1.isZero()) {
      // calculate addLiquidityQuote for token 0, base on token 1 input
      quotedAmountToken0 = getTokenEquivalenceFromReserve(
        bnAmountToken1,
        token0.decimals,
        reserveToken1,
        reserveToken0
      );
    }
  }

  const bnNewAmountToken0 = parseReadableStringToBigNumber(quotedAmountToken0, token0.decimals);
  const bnNewAmountToken1 = parseReadableStringToBigNumber(quotedAmountToken1, token1.decimals);

  // Calculate price of token0 for 1 token1
  const rateToken0Token1 = !bnNewAmountToken1.isZero()
    ? parseFloat(quotedAmountToken0) / parseFloat(quotedAmountToken1)
    : 0;

  // Calculate price of token1 for 1 token0
  const rateToken1Token0 = !bnNewAmountToken0.isZero()
    ? parseFloat(quotedAmountToken1) / parseFloat(quotedAmountToken0)
    : 0;

  const estimatedLPReceived = getLPReceived(pool, bnNewAmountToken0, bnNewAmountToken1);

  const floatEstimatedLPReceived = parseFloat(estimatedLPReceived);
  const minEstimatedLPReceived = (floatEstimatedLPReceived - floatEstimatedLPReceived * slippage).toString(10);

  // 100% of pool share if first deposit
  const poolShare = isFirstDeposit ? 100 : getShareOfPool(pool, totalSupply, minEstimatedLPReceived);
  return {
    quotedAmountToken0,
    quotedAmountToken1,
    rateToken0Token1,
    rateToken1Token0,
    estimatedLPReceived: minEstimatedLPReceived,
    poolShare,
    slippage,
    isFirstDeposit,
  };
};

export const removeLiquidityQuote = (
  pool: PoolState,
  amountLPToRemove: string,
  totalSupply: Uint256,
  reserveToken0: Uint256,
  reserveToken1: Uint256,
  slippage: number
) => {
  const bnAmountLPToRemove = parseReadableStringToBigNumber(amountLPToRemove, pool.decimals);
  const bnTotalSupply = uint256ToBigNumber(totalSupply);
  // return if pool empty
  if (bnTotalSupply.isZero()) {
    return {
      minToken0Received: "0",
      minToken1Received: "0",
      totalSupply,
    };
  }
  const bnReserveToken0 = uint256ToBigNumber(reserveToken0);
  const bnReserveToken1 = uint256ToBigNumber(reserveToken1);
  const estimatedToken0Received = formatBigNumberToReadableString(
    bnAmountLPToRemove.mul(bnReserveToken0).div(bnTotalSupply),
    pool.token0.decimals
  );
  const estimatedToken1Received = formatBigNumberToReadableString(
    bnAmountLPToRemove.mul(bnReserveToken1).div(bnTotalSupply),
    pool.token1.decimals
  );

  const floatEstimatedToken0Received = parseFloat(estimatedToken0Received);
  const minToken0Received = floatEstimatedToken0Received - floatEstimatedToken0Received * slippage;

  const floatEstimatedToken1Received = parseFloat(estimatedToken1Received);
  const minToken1Received = floatEstimatedToken1Received - floatEstimatedToken1Received * slippage;

  return {
    minToken0Received: toFixed(minToken0Received, pool.token0.decimals),
    minToken1Received: toFixed(minToken1Received, pool.token1.decimals),
    totalSupply,
  };
};
