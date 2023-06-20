import React, { useEffect } from "react";
import type { AccountInterface, AddTransactionResponse, CallContractResponse, Invocation, Uint256 } from "starknet";

import { addLiquidityQuote, removeLiquidityQuote } from "../../helpers/liquidity";
import {
  bigNumberToUint256,
  formatBNToReadableString,
  formatUint256ToReadableString,
  getAmountPercentage,
  getShareOfPool,
  parseReadableStringToBigNumber,
  parseReadableStringToUint256,
  parseStringArrayToUint256,
  readableStringNotZeroOrUndefined,
  stringHexToStringDec,
} from "../../helpers/math";
import { getTotalLiquidityInUSD } from "../../helpers/pool";
import { isEnoughBalance } from "../../helpers/token";
import { displayError } from "../../services/toast.service";
import { ARFError, NotEnoughBalanceError, PoolNotExistError, UnknownError } from "../ARFError";
import { useBlock } from "../BlockProvider";
import { useContract } from "../ContractProvider";
import { useStarknet } from "../StarknetProvider";
import { useTransactions } from "../TransactionsProvider";
import { useTranslate } from "../TranslateProvider";
import type { PoolState, TokenState } from "../WalletBaseProvider";
import { useWalletBase } from "../WalletBaseProvider";
import { useWallet } from "../WalletProvider";

import type { AddLiquidityQuoteState, LiquidityManagerState, RemoveLiquidityQuoteState } from "./model";
import { POOL_STATE_INITIAL_STATE } from "./model";

interface PoolManagerState {
  pools: PoolState[];
  currentAddLiquidityQuote?: AddLiquidityQuoteState;
  currentRemoveLiquidityQuote?: RemoveLiquidityQuoteState;
}

interface FetchPools {
  type: "fetch_pools";
  pools: PoolState[];
}

interface AddPool {
  type: "add_pool";
  pool: PoolState;
}

interface UpdatePoolReserves {
  type: "update_pool_reserves";
  reserveToken0: Uint256;
  reserveToken1: Uint256;
  totalSupply: Uint256;
  pool: PoolState;
  blockHash: string | undefined;
}

interface ResetPoolBalance {
  type: "reset_pool_balance";
}

interface UpdatePoolBalance {
  type: "update_pool_balance";
  balance: string;
  pool: PoolState;
  token0AmountPooled: string;
  token1AmountPooled: string;
  poolShare: number;
}

interface ResetAddLiquidityQuote {
  type: "reset_add_liquidity_quote";
}

interface ResetRemoveLiquidityQuote {
  type: "reset_remove_liquidity_quote";
}

interface UpdateAddLiquidityQuote {
  type: "update_add_liquidity_quote";
  loading: boolean;
  pool?: PoolState;
  amountToken0: string;
  amountToken1: string;
  estimatedLPReceived: string;
  poolShare: number;
  slippage: number;
  isFirstAmountUpdated: boolean;
  isFirstDeposit: boolean;
  token0?: TokenState;
  token1?: TokenState;
  rateToken0Token1: number;
  rateToken1Token0: number;
  error: ARFError | undefined;
}

interface UpdateRemoveLiquidityQuote {
  type: "update_remove_liquidity_quote";
  loading: boolean;
  pool?: PoolState;
  amountLP: string;
  minToken0Received: string;
  minToken1Received: string;
  slippage: number;
  error: ARFError | undefined;
}

type Action =
  | UpdateAddLiquidityQuote
  | ResetAddLiquidityQuote
  | ResetRemoveLiquidityQuote
  | UpdateRemoveLiquidityQuote
  | UpdatePoolReserves
  | ResetPoolBalance
  | UpdatePoolBalance
  | FetchPools
  | AddPool;

function reducer(state: PoolManagerState, action: Action): PoolManagerState {
  switch (action.type) {
    case "fetch_pools": {
      return {
        ...state,
        pools: action.pools,
      };
    }
    case "add_pool": {
      return {
        ...state,
        pools: [...state.pools, action.pool],
      };
    }
    case "update_pool_reserves": {
      const poolIndex = state.pools.findIndex((pool) => pool.address === action.pool.address);

      const newPools = [...state.pools];
      if (poolIndex > -1) {
        const { reserveToken0, reserveToken1 } = action;
        const actualPool = newPools[poolIndex];
        newPools[poolIndex] = {
          ...actualPool,
          reserveToken0,
          reserveToken1,
          totalSupply: action.totalSupply,
          liquidityUSD: getTotalLiquidityInUSD(actualPool, reserveToken0, reserveToken1),
          lastBlockHash: action.blockHash,
        };
      }

      return {
        ...state,
        pools: newPools,
      };
    }
    case "reset_pool_balance": {
      return {
        ...state,
        pools: [...state.pools].map((pool) => {
          return {
            ...pool,
            balance: "0",
            token0AmountPooled: "0",
            token1AmountPooled: "0",
            poolShare: 0,
          };
        }),
      };
    }
    case "update_pool_balance": {
      const poolIndex = state.pools.findIndex((pool) => pool.address === action.pool.address);

      const newPools = [...state.pools];
      if (poolIndex > -1) {
        newPools[poolIndex] = {
          ...newPools[poolIndex],
          balance: action.balance,
          token0AmountPooled: action.token0AmountPooled,
          token1AmountPooled: action.token1AmountPooled,
          poolShare: action.poolShare,
        };
      }

      return {
        ...state,
        pools: newPools,
      };
    }
    case "reset_add_liquidity_quote": {
      return {
        ...state,
        currentAddLiquidityQuote: undefined,
      };
    }
    case "reset_remove_liquidity_quote": {
      return {
        ...state,
        currentRemoveLiquidityQuote: undefined,
      };
    }
    case "update_add_liquidity_quote": {
      return {
        ...state,
        currentAddLiquidityQuote: {
          loading: action.loading,
          pool: action.pool,
          amountToken0: action.amountToken0,
          amountToken1: action.amountToken1,
          estimatedLPReceived: action.estimatedLPReceived,
          token0: action.token0,
          token1: action.token1,
          poolShare: action.poolShare,
          slippage: action.slippage,
          isFirstDeposit: action.isFirstDeposit,
          isFirstAmountUpdated: action.isFirstAmountUpdated,
          rateToken0Token1: action.rateToken0Token1,
          rateToken1Token0: action.rateToken1Token0,
          error: action.error,
        },
      };
    }
    case "update_remove_liquidity_quote": {
      return {
        ...state,
        currentRemoveLiquidityQuote: {
          loading: action.loading,
          amountLPToken: action.amountLP,
          pool: action.pool,
          minToken0Received: action.minToken0Received,
          minToken1Received: action.minToken1Received,
          slippage: action.slippage,
          error: action.error,
        },
      };
    }
    default: {
      return state;
    }
  }
}

const usePoolManager = (): LiquidityManagerState => {
  const [state, dispatch] = React.useReducer(reducer, {
    ...POOL_STATE_INITIAL_STATE,
  });

  const { t } = useTranslate();
  const { chainId, account } = useStarknet();
  const { blockHash } = useBlock();
  const { swapControllerContract, liquidityPoolContract } = useContract();
  const { addTransaction } = useTransactions();
  const { getBalance } = useWalletBase();
  const { getTokenBalance, tokens } = useWallet();
  const { currentAddLiquidityQuote, currentRemoveLiquidityQuote, pools } = state;

  // Called when account changed
  useEffect(() => {
    if (!account) {
      // reset wallet if account is undefined (disconnected)
      dispatch({
        type: "reset_pool_balance",
      });
    }
  }, [account]);

  const getPoolFromTokens = React.useCallback(
    (token0: TokenState, token1: TokenState) => {
      // Get registered pool from 2 tokens
      return pools.find((pool) => {
        return (
          (pool.token0.address === token0.address && pool.token1.address === token1.address) ||
          (pool.token1.address === token0.address && pool.token0.address === token1.address)
        );
      });
    },
    [pools]
  );

  const getTokenState = React.useCallback(
    (tokenAddress: string) => {
      const token = tokens.find(
        (tokenToCheck: TokenState) => stringHexToStringDec(tokenToCheck.address) === stringHexToStringDec(tokenAddress)
      );
      // Remove balance as it is not represent the state of wallet
      // Only the ref to token infos
      return {
        ...token,
        balance: "0",
      };
    },
    [tokens]
  );

  const getAllPools = React.useCallback(async () => [], []);

  const getReserves = React.useCallback(
    async (pool: PoolState) => {
      // Check if pool reserve already found in state
      const poolIndex = pools.findIndex((poolValue) => poolValue.address === pool.address);

      let tempPool: PoolState;
      if (poolIndex > -1) {
        tempPool = pools[poolIndex];
        // Return if last hash checked is same as current hash
        if (tempPool.lastBlockHash === blockHash) {
          return Promise.resolve({
            ...tempPool,
          });
        }
      }
      // Reserve not fetch or reserve outdated -> fetch new datas

      liquidityPoolContract.attach(pool.address);
      // Pool reserve should be fetch or re-fetch depending on las blockHash
      const fetchPromises = [liquidityPoolContract.getReserves(), liquidityPoolContract.totalSupply()];
      return Promise.all(fetchPromises).then((response: CallContractResponse[]) => {
        const [reservesResponse, supplyResponse] = response;
        const reserveToken0: Uint256 = parseStringArrayToUint256([
          // @ts-ignore
          formatBNToReadableString(reservesResponse.reserve_token_0.low),
          // @ts-ignore
          formatBNToReadableString(reservesResponse.reserve_token_0.high),
        ]);
        const reserveToken1: Uint256 = parseStringArrayToUint256([
          // @ts-ignore
          formatBNToReadableString(reservesResponse.reserve_token_1.low),
          // @ts-ignore
          formatBNToReadableString(reservesResponse.reserve_token_1.high),
        ]);

        const totalSupply: Uint256 = parseStringArrayToUint256([
          // @ts-ignore
          formatBNToReadableString(supplyResponse.totalSupply.low),
          // @ts-ignore
          formatBNToReadableString(supplyResponse.totalSupply.high),
        ]);

        dispatch({
          type: "update_pool_reserves",
          pool,
          reserveToken0,
          reserveToken1,
          totalSupply,
          blockHash,
        });

        return {
          ...tempPool,
          pool,
          lastBlockHash: blockHash,
          reserveToken0,
          reserveToken1,
          totalSupply,
        };
      });
    },
    [liquidityPoolContract, pools, blockHash]
  );

  const getRemoveLiquidityQuote = React.useCallback(
    async (pool: PoolState, amountLPToken: string, slippage: number) => {
      // We know tokenFrom & tokenTo are defined & Pool exists
      return getReserves(pool).then(({ reserveToken0, reserveToken1, totalSupply }) => {
        return removeLiquidityQuote(pool, amountLPToken, totalSupply, reserveToken0, reserveToken1, slippage);
      });
    },
    [getReserves]
  );

  const getLPBalance = React.useCallback(
    async (pool: PoolState, callerAccount: AccountInterface) => {
      getBalance(pool, callerAccount).then((value: CallContractResponse) => {
        const newLPBalance = formatUint256ToReadableString(
          {
            // @ts-ignore
            low: formatBNToReadableString(value.balance.low),
            // @ts-ignore
            high: formatBNToReadableString(value.balance.high),
          },
          pool.decimals
        );
        if (readableStringNotZeroOrUndefined(newLPBalance, pool.decimals)) {
          // Get a quote for remove liquidity, to get amount token0 & token1 pooled, with a 0% slippage
          getRemoveLiquidityQuote(pool, newLPBalance, 0).then((quoteResult) => {
            const {
              minToken0Received: token0AmountPooled,
              minToken1Received: token1AmountPooled,
              totalSupply,
            } = quoteResult;
            const poolShare = getShareOfPool(pool, totalSupply, newLPBalance, false);
            dispatch({
              type: "update_pool_balance",
              balance: newLPBalance,
              token0AmountPooled,
              token1AmountPooled,
              poolShare,
              pool,
            });
          });
        } else {
          dispatch({
            type: "update_pool_balance",
            balance: newLPBalance,
            token0AmountPooled: "0",
            token1AmountPooled: "0",
            poolShare: 0,
            pool,
          });
        }
      });
    },
    [getRemoveLiquidityQuote, getBalance]
  );

  // Need to init token list before call
  const getLPBalanceForAll = React.useCallback(
    async (poolsToGetBalance: PoolState[], callerAccount: AccountInterface) => {
      poolsToGetBalance.forEach((pool: PoolState) => {
        getLPBalance(pool, callerAccount);
      });
    },
    [getLPBalance]
  );

  const addLiquidity = React.useCallback(
    async (addLiquidityQuote: AddLiquidityQuoteState, adderAccount: AccountInterface) => {
      const { amountToken0, amountToken1, token0, token1, slippage, pool } = addLiquidityQuote;
      if (!token0 || !token1 || !pool) throw new UnknownError();

      const amountToken0Min = getAmountPercentage(
        parseReadableStringToBigNumber(amountToken0, token0.decimals),
        slippage
      );
      const amountToken1Min = getAmountPercentage(
        parseReadableStringToBigNumber(amountToken1, token1.decimals),
        slippage
      );
      const amountToken0MinUint256 = bigNumberToUint256(amountToken0Min);
      const amountToken1MinUint256 = bigNumberToUint256(amountToken1Min);
      const amountToken0DesiredUin256 = parseReadableStringToUint256(amountToken0, token0.decimals);
      const amountToken1DesiredUin256 = parseReadableStringToUint256(amountToken1, token1.decimals);
      const approveToken0Calldata = [
        stringHexToStringDec(swapControllerContract.address),
        amountToken0DesiredUin256.low,
        amountToken0DesiredUin256.high,
      ];
      const approveToken1Calldata = [
        stringHexToStringDec(swapControllerContract.address),
        amountToken1DesiredUin256.low,
        amountToken1DesiredUin256.high,
      ];
      const addLiquidityCalldata = [
        stringHexToStringDec(token0.address),
        stringHexToStringDec(token1.address),
        amountToken0DesiredUin256.low,
        amountToken0DesiredUin256.high,
        amountToken1DesiredUin256.low,
        amountToken1DesiredUin256.high,
        amountToken0MinUint256.low,
        amountToken0MinUint256.high,
        amountToken1MinUint256.low,
        amountToken1MinUint256.high,
      ];

      const actionLabel = `${t.pool.add_liquidity} ${token0.symbol} - ${token1.symbol}`;

      // construct approve token tx
      const approveToken0Tx: Invocation = {
        contractAddress: token0.address,
        entrypoint: "approve",
        calldata: approveToken0Calldata,
      };
      const approveToken1Tx: Invocation = {
        contractAddress: token1.address,
        entrypoint: "approve",
        calldata: approveToken1Calldata,
      };

      // construct addLiquidity tx
      const addLiquidityTx: Invocation = {
        contractAddress: swapControllerContract.address,
        entrypoint: "addLiquidity",
        calldata: addLiquidityCalldata,
      };

      // Execute multiCall on account contract
      adderAccount
        .execute([approveToken0Tx, approveToken1Tx, addLiquidityTx])
        .then((value: AddTransactionResponse) => {
          addTransaction(
            value,
            actionLabel,
            () => {
              // On success, reload balance & allowance
              getTokenBalance(token0, adderAccount);
              getTokenBalance(token1, adderAccount);
              getLPBalance(pool, adderAccount);
            },
            () => {}
          );
          // reset the quote -> to reset the view
          dispatch({
            type: "reset_add_liquidity_quote",
          });
        })
        .catch(() => {
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [swapControllerContract, addTransaction, getLPBalance, getTokenBalance, t]
  );

  const getAddLiquidityQuote = React.useCallback(
    async (
      pool: PoolState,
      amountToken0: string,
      amountToken1: string,
      isFirstAmountUpdated: boolean,
      slippage: number
    ) => {
      // We know tokenFrom & tokenTo are defined & Pool exists
      return getReserves(pool).then(({ reserveToken0, reserveToken1, totalSupply }) => {
        return addLiquidityQuote(
          pool,
          amountToken0,
          amountToken1,
          isFirstAmountUpdated,
          totalSupply,
          reserveToken0,
          reserveToken1,
          slippage
        );
      });
    },
    [getReserves]
  );

  // Get an updated addLiquidityQuote
  const updateAddLiquidityQuote = React.useCallback(
    async (
      token0: TokenState | undefined,
      token1: TokenState | undefined,
      amountToken0: string,
      amountToken1: string,
      isFirstAmountUpdated: boolean,
      slippage: number
    ) => {
      let updateQuoteBase: UpdateAddLiquidityQuote = {
        type: "update_add_liquidity_quote",
        pool: undefined,
        loading: true,
        token0,
        token1,
        rateToken0Token1: 0,
        rateToken1Token0: 0,
        amountToken0,
        amountToken1,
        estimatedLPReceived: "",
        poolShare: 0,
        slippage,
        isFirstDeposit: false,
        isFirstAmountUpdated,
        error: undefined,
      };

      Promise.resolve()
        .then(() => {
          // token0 or token1 not defined, or amount not defined
          // update to empty addLiquidityQuote
          if (!token0 || !token1 || (amountToken0 === "" && amountToken1 === "")) {
            dispatch({ ...updateQuoteBase, loading: false });
            return;
          }

          const pool = getPoolFromTokens(token0, token1);
          if (!pool) {
            throw new PoolNotExistError();
          }

          // dispatch addLiquidityQuote loading
          dispatch({ ...updateQuoteBase });

          // Check tokens order
          const isTokenInvertedInPool = pool.token0.address !== token0.address;

          // Get addLiquidityQuote for current params
          getAddLiquidityQuote(
            pool,
            isTokenInvertedInPool ? amountToken1 : amountToken0,
            isTokenInvertedInPool ? amountToken0 : amountToken1,
            isTokenInvertedInPool ? !isFirstAmountUpdated : isFirstAmountUpdated,
            slippage
          ).then((quoteResult) => {
            if (quoteResult) {
              const {
                quotedAmountToken0,
                quotedAmountToken1,
                estimatedLPReceived,
                rateToken0Token1,
                rateToken1Token0,
                poolShare,
                isFirstDeposit,
              } = quoteResult;
              const orderedRateToken0Token1 = isTokenInvertedInPool ? rateToken1Token0 : rateToken0Token1;
              const orderedRateToken1Token0 = isTokenInvertedInPool ? rateToken0Token1 : rateToken1Token0;
              const orderedQuotedAmount0 = isTokenInvertedInPool ? quotedAmountToken1 : quotedAmountToken0;
              const orderedQuotedAmount1 = isTokenInvertedInPool ? quotedAmountToken0 : quotedAmountToken1;
              // Check balance for token0 if user is connected
              if (account) {
                const enoughToken0 = isEnoughBalance(token0, orderedQuotedAmount0);
                const enoughToken1 = isEnoughBalance(token1, orderedQuotedAmount1);
                let error;
                if (!enoughToken0 && !enoughToken1) {
                  error = new NotEnoughBalanceError(token0, token1);
                } else if (!enoughToken0) {
                  error = new NotEnoughBalanceError(token0);
                } else if (!enoughToken1) {
                  error = new NotEnoughBalanceError(token1);
                }
                updateQuoteBase = {
                  ...updateQuoteBase,
                  error,
                };
              }

              dispatch({
                ...updateQuoteBase,
                type: "update_add_liquidity_quote",
                loading: false,
                pool,
                token0,
                token1,
                rateToken0Token1: orderedRateToken0Token1,
                rateToken1Token0: orderedRateToken1Token0,
                amountToken0: orderedQuotedAmount0,
                amountToken1: orderedQuotedAmount1,
                estimatedLPReceived,
                poolShare,
                slippage,
                isFirstDeposit,
              });
            } else {
              throw new UnknownError();
            }
          });
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
    [getPoolFromTokens, getAddLiquidityQuote, account]
  );

  const removeLiquidity = React.useCallback(
    async (removeLiquidityQuote: RemoveLiquidityQuoteState, removerAccount: AccountInterface) => {
      const { amountLPToken, minToken0Received, minToken1Received, pool } = removeLiquidityQuote;
      if (!pool) throw new UnknownError();
      const amountLPTokenUint256 = parseReadableStringToUint256(amountLPToken, pool.decimals);
      const amountToken0MinUint256 = parseReadableStringToUint256(minToken0Received, pool.token0.decimals);
      const amountToken1MinUint256 = parseReadableStringToUint256(minToken1Received, pool.token1.decimals);

      const approveCalldata = [
        stringHexToStringDec(swapControllerContract.address),
        amountLPTokenUint256.low,
        amountLPTokenUint256.high,
      ];
      const removeLiquidityCalldata = [
        stringHexToStringDec(pool.token0.address),
        stringHexToStringDec(pool.token1.address),
        amountToken0MinUint256.low,
        amountToken0MinUint256.high,
        amountToken1MinUint256.low,
        amountToken1MinUint256.high,
        amountLPTokenUint256.low,
        amountLPTokenUint256.high,
      ];

      // construct approve token tx
      const approveLPTx: Invocation = {
        contractAddress: pool.address,
        entrypoint: "approve",
        calldata: approveCalldata,
      };

      // construct swap token tx
      const removeLiquidityTokenTx: Invocation = {
        contractAddress: swapControllerContract.address,
        entrypoint: "removeLiquidity",
        calldata: removeLiquidityCalldata,
      };

      const { token0, token1 } = pool;
      const actionLabel = `${t.pool.remove_liquidity} ${token0.symbol} - ${token1.symbol}`;
      // Execute multiCall on account contract
      removerAccount
        .execute([approveLPTx, removeLiquidityTokenTx])
        .then((value: AddTransactionResponse) => {
          addTransaction(
            value,
            actionLabel,
            () => {
              // On success, reload balance & allowance
              getTokenBalance(token0, removerAccount);
              getTokenBalance(token1, removerAccount);
              getLPBalance(pool, removerAccount);
            },
            () => {}
          );
          // reset the quote -> to reset the view
          dispatch({
            type: "reset_remove_liquidity_quote",
          });
        })
        .catch(() => {
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [swapControllerContract, addTransaction, getLPBalance, getTokenBalance, t]
  );

  const updateRemoveLiquidityQuote = React.useCallback(
    async (pool: PoolState, amountLPToken: string, slippage: number) => {
      const updateQuoteBase: UpdateRemoveLiquidityQuote = {
        type: "update_remove_liquidity_quote",
        loading: true,
        amountLP: amountLPToken,
        minToken0Received: "0",
        minToken1Received: "0",
        pool,
        slippage,
        error: undefined,
      };
      Promise.resolve()
        .then(() => {
          // pool not defined, or amount not defined, or account not defined
          // update to empty removeLiquidityQuote
          if (!pool || amountLPToken === "" || !account) {
            dispatch({ ...updateQuoteBase, loading: false });
            return;
          }

          // Pool to remove LP not exist
          if (!pool) {
            throw new PoolNotExistError();
          }

          // User has not enough LP token
          if (!isEnoughBalance(pool, amountLPToken)) {
            throw new NotEnoughBalanceError(pool);
          }

          // dispatch removeLiquidityQuote loading
          dispatch({ ...updateQuoteBase });

          getRemoveLiquidityQuote(pool, amountLPToken, slippage).then((quoteResult) => {
            if (quoteResult) {
              const { minToken0Received, minToken1Received } = quoteResult;
              dispatch({
                ...updateQuoteBase,
                type: "update_remove_liquidity_quote",
                loading: false,
                pool,
                amountLP: amountLPToken,
                minToken0Received,
                minToken1Received,
                slippage,
              });
            } else {
              throw new UnknownError();
            }
          });
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
    [account, getRemoveLiquidityQuote]
  );

  return {
    pools,
    getReserves,
    getLPBalance,
    getLPBalanceForAll,
    getPoolFromTokens,
    getAllPools,
    addLiquidity,
    removeLiquidity,
    updateAddLiquidityQuote,
    updateRemoveLiquidityQuote,
    currentAddLiquidityQuote,
    currentRemoveLiquidityQuote,
  };
};

export default usePoolManager;
