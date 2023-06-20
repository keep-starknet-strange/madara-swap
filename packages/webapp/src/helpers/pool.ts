// Get a percentage by newValue / balance
import type { Uint256 } from "starknet/utils/uint256";

import type { PoolState } from "../context/WalletBaseProvider";

import { formatBigNumberToReadableString, uint256ToBigNumber } from "./math";

export const amountToPercentage = (value: string, poolBalance: string): number => {
  if (!value || value === "") return 0;
  const floatBalance = parseFloat(poolBalance);
  if (poolBalance === "" || floatBalance === 0) return 0;

  return +Math.min((parseFloat(value) / floatBalance) * 100, 100).toFixed(2);
};

// Get a % of balance
export const percentageToAmount = (percentage: number, poolBalance: string): string => {
  if (percentage === 0) return "0";
  if (percentage === 100) return poolBalance.toString();
  return ((parseFloat(poolBalance) / 100) * percentage).toString();
};

// Get the fraction of a an amount
export const percentageOfAmount = (percentage: number, amount: string): string | undefined => {
  if (amount === "") return undefined;
  return ((parseFloat(amount) / 100) * percentage).toString();
};

// Get total liquidity i nUSD from reserve & tokens
// TODO Make a service to fetch price from CMC / CoinGecko ??
export const getTotalLiquidityInUSD = (pool: PoolState, reserveToken0: Uint256, reserveToken1: Uint256): string => {
  const bnReserveToken0 = uint256ToBigNumber(reserveToken0);
  const bnReserveToken1 = uint256ToBigNumber(reserveToken1);
  // Here we fixed both price at 0.419$ for testing purpose
  return formatBigNumberToReadableString(
    bnReserveToken0.mul(419).div(1000).add(bnReserveToken1.mul(419).div(1000)),
    pool.decimals
  );
};
