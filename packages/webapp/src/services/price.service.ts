import type { PoolState, TokenState } from "../context/WalletBaseProvider";
import { formatUint256ToReadableString } from "../helpers/math";

// TODO Fetch the price of token from coinGecko or cmc
export function getTokenPrice(token: TokenState) {
  return 0.43; // In USD, for testing purpose
}

export function getTotalLiquidityFromPool(pool: PoolState) {
  return (
    getTokenPrice(pool.token0) * parseFloat(formatUint256ToReadableString(pool.reserveToken0, pool.token0.decimals)) +
    getTokenPrice(pool.token1) * parseFloat(formatUint256ToReadableString(pool.reserveToken1, pool.token1.decimals))
  ); // In USD, for testing purpose
}
