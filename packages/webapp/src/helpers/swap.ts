import type { BigNumber } from "ethers";

import type { TokenState } from "../context/WalletBaseProvider";

import { formatBigNumberToReadableString, parseReadableStringToBigNumber } from "./math";

const LP_PROVIDER_FEE = 0.003; // 0.3%

export const quote = (
  reserveTokenFrom: BigNumber,
  reserveTokenTo: BigNumber,
  tokenFrom: TokenState,
  tokenTo: TokenState,
  readableAmountTokenFrom: string,
  slippage: number
) => {
  // Calculate input - fee
  const bnAmountTokenFrom: BigNumber = parseReadableStringToBigNumber(readableAmountTokenFrom, tokenFrom.decimals);
  const bnAmountTokenFromFee = bnAmountTokenFrom.mul(LP_PROVIDER_FEE * 1000).div(1000);
  const bnAmountTokenFromMinusFee = bnAmountTokenFrom.sub(bnAmountTokenFromFee);

  // Reserve to readable
  const readableReserveFrom = formatBigNumberToReadableString(reserveTokenFrom, tokenFrom.decimals);
  const readableReserveTo = formatBigNumberToReadableString(reserveTokenTo, tokenFrom.decimals);

  // Calculate the initial price of tokenTo
  const floatReserveTo = parseFloat(readableReserveTo);
  const initialPricePerTokenTo = floatReserveTo > 0 ? parseFloat(readableReserveFrom) / floatReserveTo : 0;
  const constantReserveProduct = reserveTokenFrom.mul(reserveTokenTo);

  // Calculate reserve after swap
  const newReserveTokenFrom = reserveTokenFrom.add(bnAmountTokenFromMinusFee);
  const newReserveTokenTo = constantReserveProduct.div(newReserveTokenFrom);

  // Calculate amount received
  const amountReceived = reserveTokenTo.sub(newReserveTokenTo);

  // Convert to readable
  const readableAmountReceived = formatBigNumberToReadableString(amountReceived, tokenTo.decimals);

  // Calculate minReceived based on amountReceived calculated before & slippage
  const floatAmountReceived = parseFloat(readableAmountReceived);
  const minAmountReceived = (floatAmountReceived - floatAmountReceived * slippage).toString(10);

  // Parse fee to float
  const readableLpFee = formatBigNumberToReadableString(bnAmountTokenFromFee, tokenFrom.decimals);

  // Parse amount to float
  const floatAmountTokenFrom = parseFloat(formatBigNumberToReadableString(bnAmountTokenFrom, tokenFrom.decimals));

  // Calculate price of tokenTo after swap
  const pricePerTokenTo =
    floatAmountReceived > 0 ? floatAmountTokenFrom / parseFloat(readableAmountReceived.toString()) : 0;

  // Calculate price of tokenFrom after swap
  const pricePerTokenFrom =
    floatAmountTokenFrom > 0 ? parseFloat(readableAmountReceived.toString()) / floatAmountTokenFrom : 0;

  const decrease = pricePerTokenTo - initialPricePerTokenTo;

  // Calculate price impact based on price before & after swap
  const priceImpact = pricePerTokenTo > 0 ? (decrease / pricePerTokenTo) * 100 : 0;

  return {
    amountReceived,
    pricePerTokenTo,
    pricePerTokenFrom,
    priceImpact,
    lpFee: readableLpFee,
    minAmountReceived,
  };
};
