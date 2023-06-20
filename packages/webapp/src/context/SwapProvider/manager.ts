import React from "react";
import type { AccountInterface, AddTransactionResponse, Invocation } from "starknet";

import { useTranslate } from "context/TranslateProvider";
import {
  bigNumberToUint256,
  formatBigNumberToReadableString,
  isUint256Zero,
  parseReadableStringToBigNumber,
  parseReadableStringToUint256,
  stringHexToStringDec,
  toFixed,
  uint256ToBigNumber,
} from "../../helpers/math";
import { quote } from "../../helpers/swap";
import { isEnoughBalance } from "../../helpers/token";
import { displayError } from "../../services/toast.service";
import { ARFError, NotEnoughBalanceError, NotEnoughLiquidityError, PoolNotExistError, UnknownError } from "../ARFError";
import { useContract } from "../ContractProvider";
import { usePool } from "../PoolProvider";
import { useStarknet } from "../StarknetProvider";
import { useTransactions } from "../TransactionsProvider";
import type { TokenState } from "../WalletBaseProvider";
import { useWallet } from "../WalletProvider";

import type { SwapQuoteState, SwapState } from "./model";
import { SWAP_STATE_INITIAL_STATE } from "./model";

interface SwapManagerState {
  currentSwapQuote?: SwapQuoteState;
}

interface ResetQuote {
  type: "reset_quote";
}

interface UpdateQuote {
  type: "update_quote";
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
  error: ARFError | undefined;
}

type Action = UpdateQuote | ResetQuote;

function reducer(state: SwapManagerState, action: Action): SwapManagerState {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action.type) {
    case "update_quote": {
      return {
        ...state,
        currentSwapQuote: {
          loading: action.loading,
          slippage: action.slippage,
          amountTokenFrom: action.amountTokenFrom,
          amountTokenTo: action.amountTokenTo,
          tokenFrom: action.tokenFrom,
          tokenTo: action.tokenTo,
          rateToken0Token1: action.rateToken0Token1,
          rateToken1Token0: action.rateToken1Token0,
          minAmountReceived: action.minAmountReceived,
          priceImpact: action.priceImpact,
          lpFee: action.lpFee,
          route: action.route,
          error: action.error,
        },
      };
    }
    case "reset_quote": {
      return {
        ...state,
        currentSwapQuote: undefined,
      };
    }
    default: {
      return state;
    }
  }
}

const useSwapManager = (): SwapState => {
  const [state, dispatch] = React.useReducer(reducer, {
    ...SWAP_STATE_INITIAL_STATE,
  });

  const { t } = useTranslate();
  const { account } = useStarknet();
  const { swapControllerContract } = useContract();
  const { getReserves, getPoolFromTokens } = usePool();
  const { getTokenBalance } = useWallet();
  const { addTransaction } = useTransactions();
  const { currentSwapQuote } = state;

  // TODO is there a case when output amount could be > reserve token ???? I think no but to check
  const getQuote = React.useCallback(
    async (
      amountTokenFrom: string, // We are sure it is defined
      tokenFrom: TokenState,
      tokenTo: TokenState,
      slippage: number
    ) => {
      const pool = getPoolFromTokens(tokenFrom, tokenTo);
      if (!pool) {
        throw new PoolNotExistError();
      }
      // We know tokenFrom & tokenTo are defined & Pool exists
      return getReserves(pool).then(({ reserveToken0, reserveToken1 }) => {
        // Check pool initialized & have liquidity
        if (isUint256Zero(reserveToken0) || isUint256Zero(reserveToken1)) {
          throw new NotEnoughLiquidityError();
        }

        // Check tokens order
        const reserveTokenFrom = pool.token0.address === tokenFrom.address ? reserveToken0 : reserveToken1;
        const reserveTokenTo = pool.token0.address === tokenTo.address ? reserveToken0 : reserveToken1;

        // Get & return the quote with data
        return quote(
          uint256ToBigNumber(reserveTokenFrom),
          uint256ToBigNumber(reserveTokenTo),
          tokenFrom,
          tokenTo,
          amountTokenFrom,
          slippage
        );
      });
    },
    [getReserves, getPoolFromTokens]
  );

  // Get an updated quote base on AmountTokenFrom, tokenFrom & tokenTo
  // amountToken as real, will be mult by decimals
  const updateSwapQuote = React.useCallback(
    async (
      amountTokenFrom: string,
      tokenFrom: TokenState | undefined,
      tokenTo: TokenState | undefined,
      slippage: number
    ) => {
      let updateQuoteBase: UpdateQuote = {
        type: "update_quote",
        loading: true,
        slippage,
        amountTokenFrom,
        amountTokenTo: "",
        tokenFrom,
        tokenTo,
        rateToken0Token1: 0,
        rateToken1Token0: 0,
        minAmountReceived: "",
        priceImpact: 0,
        lpFee: "",
        route: "",
        error: undefined,
      };
      // token0 or token1 not defined, or amount not defined
      // update to empty quote
      if (!tokenFrom || !tokenTo || amountTokenFrom === "") {
        dispatch({ ...updateQuoteBase, loading: false });
        return;
      }

      // Check balance if user is connected
      if (account && !isEnoughBalance(tokenFrom, amountTokenFrom)) {
        updateQuoteBase = {
          ...updateQuoteBase,
          error: new NotEnoughBalanceError(tokenFrom),
        };
      }

      // dispatch quote loading
      dispatch({ ...updateQuoteBase });
      // Get quote for current params
      getQuote(amountTokenFrom, tokenFrom, tokenTo, slippage)
        .then((quoteResult) => {
          if (quoteResult) {
            const { amountReceived, minAmountReceived, pricePerTokenTo, pricePerTokenFrom, priceImpact, lpFee } =
              quoteResult;
            // Dispatch loaded quote
            dispatch({
              ...updateQuoteBase,
              type: "update_quote",
              loading: false,
              slippage,
              amountTokenFrom,
              amountTokenTo: formatBigNumberToReadableString(amountReceived, tokenTo.decimals),
              tokenFrom,
              tokenTo,
              rateToken0Token1: pricePerTokenTo,
              rateToken1Token0: pricePerTokenFrom,
              minAmountReceived,
              priceImpact,
              route: `${tokenFrom.symbol} - ${tokenTo.symbol}(direct)`,
              lpFee,
            });
          } else {
            throw new UnknownError();
          }
        })
        .catch((error) => {
          if (error instanceof ARFError) {
            throw error;
          } else {
            throw new UnknownError(error.error);
          }
        })
        .catch((error) => {
          dispatch({
            ...updateQuoteBase,
            loading: false,
            error,
          });
        });
    },
    [getQuote, account]
  );

  const swap = React.useCallback(
    async (swapQuote: SwapQuoteState, swapperAccount: AccountInterface) => {
      const { tokenFrom, tokenTo, amountTokenFrom, minAmountReceived } = swapQuote;
      if (!tokenFrom || !tokenTo) throw new UnknownError();

      const amountTokenFromUint256 = parseReadableStringToUint256(amountTokenFrom, tokenFrom.decimals);

      const minAmountReceivedUint256 = bigNumberToUint256(
        parseReadableStringToBigNumber(toFixed(parseFloat(minAmountReceived), tokenTo.decimals), tokenTo.decimals)
      );

      const approveCalldata = [
        stringHexToStringDec(swapControllerContract.address),
        amountTokenFromUint256.low,
        amountTokenFromUint256.high,
      ];

      const swapCalldata = [
        stringHexToStringDec(tokenFrom.address),
        stringHexToStringDec(tokenTo.address),
        amountTokenFromUint256.low,
        amountTokenFromUint256.high,
        minAmountReceivedUint256.low,
        minAmountReceivedUint256.high,
      ];
      const actionLabel = `${t.swap.swap} ${tokenFrom.symbol} ${t.common.for} ${tokenTo.symbol}`;

      // construct multiCall approve + swap (uncomment to be clearer when starknetjs prettier output to ArgentX)
      // erc20Contract.attach(tokenFrom.address);
      // const approveToken = erc20Contract.populate("approve", approveCalldata);

      // construct approve token tx
      const approveTokenTx: Invocation = {
        contractAddress: tokenFrom.address,
        entrypoint: "approve",
        calldata: approveCalldata,
      };

      // construct swap token tx
      const swapTokenTx: Invocation = {
        contractAddress: swapControllerContract.address,
        entrypoint: "swapExactTokensForTokens",
        calldata: swapCalldata,
      };
      // Execute multiCall on account contract
      swapperAccount
        .execute([approveTokenTx, swapTokenTx])
        .then((value: AddTransactionResponse) => {
          addTransaction(
            value,
            actionLabel,
            () => {
              // On success, reload balance
              getTokenBalance(tokenFrom, swapperAccount);
              getTokenBalance(tokenTo, swapperAccount);
            },
            () => {}
          );
          // reset the quote -> to reset the view
          dispatch({
            type: "reset_quote",
          });
        })
        .catch(() => {
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [getTokenBalance, addTransaction, swapControllerContract, t]
  );

  return {
    currentSwapQuote,
    updateSwapQuote,
    swap,
  };
};

export default useSwapManager;
