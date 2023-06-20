import { useTranslate } from "context/TranslateProvider";
import { BigNumber } from "ethers";
import React, { useEffect } from "react";
import type { AccountInterface, AddTransactionResponse, CallContractResponse, Invocation } from "starknet";
import deployments from "../../../../contracts/deployments/katana/deployments.json";
import {
  bigNumberToUint256,
  formatBNToReadableString,
  formatUint256ToReadableString,
  isUint256Zero,
  parseReadableStringToBigNumber,
} from "../../helpers/math";
import { displayError } from "../../services/toast.service";
import { getDefaultList } from "../../services/token.service";
import { useContract } from "../ContractProvider";
import { useStarknet } from "../StarknetProvider";
import { useTransactions } from "../TransactionsProvider";
import type { PoolState, TokenState } from "../WalletBaseProvider";
import { useWalletBase } from "../WalletBaseProvider";

import type { WalletState } from "./model";
import { WALLET_STATE_INITIAL_STATE } from "./model";

const BTC_ERC20_ADDRESS = deployments.bitcoin.address;

interface WalletManagerState {
  tokens: TokenState[];
  testTokens: TokenState[];
}

interface SetTokens {
  type: "set_tokens";
  tokens: TokenState[];
  testTokens: TokenState[];
}

interface SetBalance {
  type: "set_balance";
  token: TokenState;
  balance: string;
}

interface ResetBalance {
  type: "reset_balance";
}

type Action = ResetBalance | SetBalance | SetTokens;

function reducer(state: WalletManagerState, action: Action): WalletManagerState {
  switch (action.type) {
    case "set_tokens": {
      return {
        ...state,
        tokens: action.tokens,
        testTokens: action.testTokens,
      };
    }
    case "set_balance": {
      const tokenIdx = state.tokens.findIndex((token) => token.address === action.token.address);
      const newTokens = [...state.tokens];
      if (tokenIdx > -1) {
        newTokens[tokenIdx].balance = action.balance;
        return {
          ...state,
          tokens: [...newTokens],
        };
      }
      return state;
    }
    case "reset_balance": {
      return {
        ...state,
        tokens: [...state.tokens].map((token) => {
          return {
            ...token,
            balance: "",
          };
        }),
      };
    }
    default: {
      return state;
    }
  }
}

function loadDefaultTokenList(chainId: number, dispatch: React.Dispatch<Action>): void {
  const defaultTokenList = getDefaultList(chainId).map((token) => {
    return {
      ...token,
      balance: "",
    };
  });

  // Register test tokens here // TODO remove in mainnet
  const testTokens = defaultTokenList.filter((token: TokenState) => {
    return token.address === BTC_ERC20_ADDRESS;
  });

  dispatch({ type: "set_tokens", tokens: defaultTokenList, testTokens });
}

const useWalletManager = (): WalletState => {
  const [state, dispatch] = React.useReducer(reducer, {
    ...WALLET_STATE_INITIAL_STATE,
  });

  const { t } = useTranslate();
  const { mapperControllerContract } = useContract();
  const { getBalance } = useWalletBase();
  const { account } = useStarknet();
  const { addTransaction } = useTransactions();
  const { tokens, testTokens } = state;

  // if (!tokens || tokens.length === 0) loadDefaultTokenList(chainId, dispatch);

  // Called when account changed
  useEffect(() => {
    if (!account) {
      // reset wallet if account is undefined (disconnected)
      dispatch({
        type: "reset_balance",
      });
    }
  }, [account]);

  const getTokenBalance = React.useCallback(
    async (token: TokenState, callerAccount: AccountInterface) => {
      getBalance(token, callerAccount).then((value: CallContractResponse) => {
        dispatch({
          type: "set_balance",
          balance: formatUint256ToReadableString(
            {
              // @ts-ignore
              low: formatBNToReadableString(value.balance.low),
              // @ts-ignore
              high: formatBNToReadableString(value.balance.high),
            },
            token.decimals
          ),
          token,
        });
      });
    },
    [getBalance]
  );

  // Need to init token list before call
  const getTokenBalanceForAll = React.useCallback(
    async (tokensToGetBalance: TokenState[], callerAccount: AccountInterface) => {
      tokensToGetBalance.forEach((token: TokenState) => {
        getTokenBalance(token, callerAccount);
      });
    },
    [getTokenBalance]
  );

  // Mint some tokens for user
  const freeMint = React.useCallback(
    async (tokensToMint: TokenState[], account: AccountInterface) => {
      const mintAmountdUint256 = bigNumberToUint256(parseReadableStringToBigNumber("1000", 18));
      // Mint 1k tokens
      const mintCallData = [mintAmountdUint256.low, mintAmountdUint256.high];
      const mintTxs: Invocation[] = tokensToMint.map((token: TokenState) => {
        return {
          contractAddress: token.address,
          entrypoint: "freeMint",
          calldata: mintCallData,
        };
      });

      const actionLabel = `Mint test tokens`;
      // Execute multiCall on account contract
      account
        .execute(mintTxs)
        .then((response: AddTransactionResponse) => {
          addTransaction(
            response,
            actionLabel,
            () => {
              // Refresh balance
              tokensToMint.forEach((tokenToMint) => getTokenBalance(tokenToMint, account));
            },
            () => {}
          );
        })
        .catch(() => {
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [addTransaction, getTokenBalance, t]
  );

  // Migrate all user assets from ARF
  const migrateAllAssets = React.useCallback(
    async (tokensToMigrate: (TokenState | PoolState)[], account: AccountInterface, recipientAddress: string) => {
      const actionLabel = t.common.migrate_assets;
      const multiCall: Invocation[] = [];

      // For each asset, add transfer TX to the multicall
      tokensToMigrate.forEach((asset) => {
        const amountToTransfer = bigNumberToUint256(
          parseReadableStringToBigNumber(asset.balance, asset.decimals).div(
            BigNumber.from(asset.symbol === "ETH" ? "2" : "1")
          )
        );
        // If amount to transfert != 0
        if (!isUint256Zero(amountToTransfer)) {
          // construct & add to call data the transfer TX
          multiCall.push({
            contractAddress: asset.address,
            entrypoint: "transfer",
            calldata: [recipientAddress, amountToTransfer.low, amountToTransfer.high],
          });
        }
      });

      // Sync new address at same time to mapper contract
      multiCall.push({
        contractAddress: mapperControllerContract.address,
        entrypoint: "syncNewAddress",
        calldata: [recipientAddress],
      });

      // Execute multiCall on account contract
      account
        .execute(multiCall)
        .then((response: AddTransactionResponse) => {
          addTransaction(
            response,
            actionLabel,
            () => {},
            () => {}
          );
        })
        .catch(() => {
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [t, addTransaction, mapperControllerContract]
  );

  return {
    tokens,
    testTokens,
    freeMint,
    getTokenBalance,
    getTokenBalanceForAll,
    migrateAllAssets,
  };
};

export default useWalletManager;
