import environment from "environment";
import { connect, disconnect } from "get-starknet";
import React from "react";
import { RpcProvider, type AccountInterface, type ProviderInterface } from "starknet";

import { useTranslate } from "context/TranslateProvider";
import { displayError } from "../../services/toast.service";

import type { StarknetState } from "./model";
import { STARKNET_STATE_INITIAL_STATE } from "./model";

interface StarknetManagerState {
  account?: AccountInterface;
  provider: ProviderInterface;
  connected?: boolean;
  chainId: number;
}

interface SetAccount {
  type: "set_account";
  account: AccountInterface | undefined;
}

interface SetConnected {
  type: "set_connected";
  con: boolean;
}

type Action = SetAccount | SetConnected;

function reducer(state: StarknetManagerState, action: Action): StarknetManagerState {
  switch (action.type) {
    case "set_account":
      return { ...state, account: action.account };
    case "set_connected":
      return { ...state, connected: action.con };
    default:
      return state;
  }
}

const useStarknetManager = (): StarknetState => {
  const { t } = useTranslate();
  const [state, dispatch] = React.useReducer(reducer, {
    ...STARKNET_STATE_INITIAL_STATE,
    provider: new RpcProvider({ nodeUrl: environment.providerUrl }),
  });

  const { account, provider, connected, chainId } = state;
  const walletErrorToastId = "__walletToastError__";

  const setConnected = React.useCallback(async (con: boolean) => {
    dispatch({ type: "set_connected", con });
    if (!con) {
      dispatch({ type: "set_account", account: undefined });
    }
  }, []);

  const connectBrowserWallet = React.useCallback(async () => {
    try {
      const starknet = await connect();
      if (!starknet) return;
      await starknet.enable(); // connect the wallet
      if (starknet.isConnected && starknet.account.address) {
        dispatch({ type: "set_account", account: starknet.account });
      }
    } catch (e) {
      displayError(
        t.common.wallet_warning_title,
        t.common.wallet_argent_x_extension_missing,
        undefined,
        undefined,
        walletErrorToastId
      );
    }
  }, [t]);

  const disconnectBrowserWallet = React.useCallback(async () => {
    disconnect({ clearLastWallet: true });
    setConnected(false);
  }, [setConnected]);

  const requestWatchAsset = () => {};

  return {
    account,
    provider,
    connected,
    chainId,
    connectBrowserWallet,
    disconnectBrowserWallet,
    setConnected,
    requestWatchAsset,
  };
};

export default useStarknetManager;
