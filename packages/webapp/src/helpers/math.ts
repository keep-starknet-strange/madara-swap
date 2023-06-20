import type { BigNumberish } from "ethers";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import type { Uint256 } from "starknet";
import { number, uint256 } from "starknet";

import type { PoolState } from "../context/WalletBaseProvider";

const { bnToUint256, uint256ToBN } = uint256;
const { toBN, toFelt } = number;

const ONE = BigNumber.from(1);
const TWO = BigNumber.from(2);

const bigNumberSqrt = (value: BigNumber): BigNumber => {
  let z = value.add(ONE).div(TWO);
  let y = value;
  while (z.sub(y).isNegative()) {
    y = z;
    z = value.div(z).add(z).div(TWO);
  }
  return y;
};

// Avoid scientific notation, limit length to fraction digits
export const toFixed = (x: number, fractionDigits: number) => {
  let result: any = parseFloat(x.toFixed(fractionDigits));
  if (Math.abs(result) < 1.0) {
    const e = parseInt(result.toString().split("e-")[1], 10);
    if (e) {
      result *= 10 ** (e - 1);
      result = `0.${(new Array(e).join("0") + result.toString().substring(2)).substring(0, fractionDigits)}`;
    }
  } else {
    let e = parseInt(result.toString().split("+")[1], 10);
    if (e > 20) {
      e -= 20;
      result /= 10 ** e;
      result += new Array(e + 1).join("0");
    }
  }
  return `${result}`;
};

// Transform a big string hexadecimal to a big string decimal
export const stringHexToStringDec = (valueHex: BigNumberish): string => BigNumber.from(valueHex).toString();

// ------------------ BigNNumber <-> Uin256 ------------------ //

export const uint256ToBigNumber = (value: Uint256): BigNumber => {
  // Transform hex to decimal
  try {
    return BigNumber.from(uint256ToBN(value).toString());
  } catch (e) {
    console.error("Failed to format to BigNumber", value, e);
    return BigNumber.from("0");
  }
};

export const bigNumberToUint256 = (value: BigNumber): Uint256 => {
  const asHexValue = bnToUint256(toBN(value.toString()));
  return {
    low: stringHexToStringDec(asHexValue.low),
    high: stringHexToStringDec(asHexValue.high),
  };
};

// ------------------ Uin256 ------------------ //
export const isUint256Zero = (value: Uint256): boolean => uint256ToBigNumber(value).isZero();

// Assume low = array[0], high = array[1]
export const parseStringArrayToUint256 = (value: string[]): Uint256 => ({
  low: stringHexToStringDec(value[0]),
  high: stringHexToStringDec(value[1]),
});

// ------------------ Format to readable ------------------ //
export const formatUint256ToReadableString = (value: Uint256, decimals: number): string =>
  formatUnits(uint256ToBigNumber(value), decimals);

export const formatBigNumberToReadableString = (value: BigNumber, decimals: number): string =>
  formatUnits(value, decimals);

export const formatBNToReadableString = (value: BigNumberish): string => toFelt(value);

// ------------------ Parse from readable ------------------ //

export const parseReadableStringToUint256 = (value: string, decimals: number): Uint256 => {
  return bigNumberToUint256(parseUnits(value.toString(), decimals));
};

export const parseReadableStringToBigNumber = (value: string, decimals: number): BigNumber => {
  try {
    return parseUnits(value.toString(), decimals);
  } catch (e) {
    // Parsing errors, return 0
    return BigNumber.from("0");
  }
};

export const readableStringNotZeroOrUndefined = (value: string, decimal: number): boolean => {
  return value !== "" && !parseReadableStringToBigNumber(value, decimal).isZero();
};

export const isReadableStringLowerEquals = (value0: string, value1: string, decimalValue: number): boolean => {
  return parseReadableStringToBigNumber(value0, decimalValue).lte(parseReadableStringToBigNumber(value1, decimalValue));
};

// ------------------ Calculs (be aware of types) ------------------ //

export const getLPReceived = (
  pool: PoolState,
  amountToken0: BigNumber | Uint256,
  amountToken1: BigNumber | Uint256
): string => {
  const { reserveToken0, reserveToken1 } = pool;
  const bnReserveToken0 = BigNumber.isBigNumber(reserveToken0) ? reserveToken0 : uint256ToBigNumber(reserveToken0);
  const bnReserveToken1 = BigNumber.isBigNumber(reserveToken1) ? reserveToken1 : uint256ToBigNumber(reserveToken1);
  const bnAmountToken0 = BigNumber.isBigNumber(amountToken0) ? amountToken0 : uint256ToBigNumber(amountToken0);
  const bnAmountToken1 = BigNumber.isBigNumber(amountToken1) ? amountToken1 : uint256ToBigNumber(amountToken1);

  // If it's first deposit
  if (bnReserveToken0.isZero() && bnReserveToken1.isZero()) {
    if (bnAmountToken0.isZero() || bnAmountToken1.isZero()) {
      return "0";
    }

    // TODO display min liquidity error if < minLiquidity
    const minLiquidity = 10 ** 3;
    return formatBigNumberToReadableString(
      bigNumberSqrt(bnAmountToken0.mul(bnAmountToken1)).sub(minLiquidity),
      pool.decimals
    );
  }

  // if pool is already filled
  const totalSupply = uint256ToBigNumber(pool.totalSupply);
  const lpToken0 = bnAmountToken0.mul(totalSupply);
  const lpToken1 = bnAmountToken1.mul(totalSupply);
  const quotientToken0 = lpToken0.div(bnReserveToken0);
  const quotientToken1 = lpToken1.div(bnReserveToken1);
  const result = quotientToken0.lt(quotientToken0) ? quotientToken0 : quotientToken1;
  return formatBigNumberToReadableString(result, pool.decimals);
};

// Get the share of a pool given by amounts put in
// afterAddingLiquidity = false to get actual share of pool
export const getShareOfPool = (
  pool: PoolState,
  totalSupply: Uint256,
  lpAmount: string,
  afterAddingLiquidity = true
): number => {
  const { decimals } = pool;
  const bnLPAmount = parseReadableStringToBigNumber(lpAmount, decimals);
  const bnActualTotalSupply = uint256ToBigNumber(totalSupply);
  const bnNewTotalSupply = bnActualTotalSupply.add(bnLPAmount);
  const supply = afterAddingLiquidity ? bnNewTotalSupply : bnActualTotalSupply;
  if (supply.isZero()) return 0;
  // get 2 decimals precision, sufficient to display < 0.01%
  // Multiply by 10^10 & divide by 10^8 === multiply by 100
  return Number(
    toFixed(
      parseFloat(
        bnLPAmount
          .mul(10 ** 10)
          .div(supply)
          .toString()
      ) /
        10 ** 8,
      decimals
    )
  );
};

// Get equivalence on token1 for input token0 base on reserve of the pool
export const getTokenEquivalenceFromReserve = (
  amountTokenFrom: BigNumber,
  decimalTokenTo: number,
  reserveTokenFrom: BigNumber | Uint256,
  reserveTokenTo: BigNumber | Uint256
): string => {
  // Input to BigNumber
  const bnAmountTokenFrom = BigNumber.from(amountTokenFrom);
  const bnReserveTokenFrom = BigNumber.isBigNumber(reserveTokenFrom)
    ? reserveTokenFrom
    : uint256ToBigNumber(reserveTokenFrom);
  const bnReserveTokenTo = BigNumber.isBigNumber(reserveTokenTo) ? reserveTokenTo : uint256ToBigNumber(reserveTokenTo);

  // Calculate the token equivalence
  return formatBigNumberToReadableString(
    bnAmountTokenFrom.mul(bnReserveTokenTo).div(bnReserveTokenFrom),
    decimalTokenTo
  );
};

// Get fractional amount base on input percentage
export const getAmountPercentage = (amount: BigNumber, slippage: number): BigNumber => {
  const slippageInMil = slippage * 1000;
  return amount.div(1000).mul(1000 - slippageInMil);
};
