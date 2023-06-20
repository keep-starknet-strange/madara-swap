import React, { useEffect } from "react";
import type { AccountInterface, AddTransactionResponse, CallContractResponse } from "starknet";

import { formatBNToReadableString, stringHexToStringDec } from "../../helpers/math";
import { displayError } from "../../services/toast.service";
import { useContract } from "../ContractProvider";
import { useStarknet } from "../StarknetProvider";
import { useTransactions } from "../TransactionsProvider";
import { useTranslate } from "context/TranslateProvider";

import type { WhitelistState } from "./model";
import { WHITELIST_INITIAL_STATE } from "./model";

interface SetLoadingFreeSlots {
  type: "set_loading_free_slots";
  isLoading: boolean;
}

interface SetRegistering {
  type: "set_registering";
  isLoading: boolean;
}

interface SetCheckingWhitelist {
  type: "set_checking_whitelist";
  isLoading: boolean;
}

interface SetIsWhitelisted {
  type: "set_is_whitelisted";
  isWhitelisted: boolean;
}

interface SetFreeSlots {
  type: "set_free_slots";
  freeSlots: number;
}

type Action = SetIsWhitelisted | SetLoadingFreeSlots | SetFreeSlots | SetRegistering | SetCheckingWhitelist;

function reducer(state: WhitelistState, action: Action): WhitelistState {
  switch (action.type) {
    case "set_is_whitelisted": {
      return {
        ...state,
        isWhitelisted: action.isWhitelisted,
        isCheckingWhitelist: false,
      };
    }
    case "set_free_slots": {
      return {
        ...state,
        freeSlots: action.freeSlots,
        isLoadingFreeSlots: false,
      };
    }
    case "set_loading_free_slots": {
      return {
        ...state,
        isLoadingFreeSlots: action.isLoading,
      };
    }
    case "set_registering": {
      return {
        ...state,
        isRegistering: action.isLoading,
      };
    }
    case "set_checking_whitelist": {
      return {
        ...state,
        isCheckingWhitelist: action.isLoading,
      };
    }
    default: {
      return state;
    }
  }
}

const useWhitelistManager = (): WhitelistState => {
  const { t } = useTranslate();
  const { account } = useStarknet();
  const [state, dispatch] = React.useReducer(reducer, {
    ...WHITELIST_INITIAL_STATE,
  });

  const { accessControllerContract } = useContract();
  const { addTransaction } = useTransactions();
  const { isWhitelisted, freeSlots, isRegistering, isLoadingFreeSlots, isCheckingWhitelist } = state;

  // Called when account changed
  useEffect(() => {
    if (!account) {
      // reset whitelisted if account is undefined (disconnected)
      dispatch({
        type: "set_is_whitelisted",
        isWhitelisted: false,
      });
    }
  }, [account]);

  const getFreeSlots = React.useCallback(async () => {
    dispatch({
      type: "set_loading_free_slots",
      isLoading: true,
    });
    return accessControllerContract
      .freeSlotsCount()
      .then((response: CallContractResponse) => {
        dispatch({
          type: "set_free_slots",
          freeSlots: parseInt(
            // @ts-ignore
            formatBNToReadableString(response.free_slots_count),
            10
          ),
        });
      })
      .catch(() => {
        dispatch({
          type: "set_loading_free_slots",
          isLoading: false,
        });
      });
  }, [accessControllerContract]);

  const checkWhitelisted = React.useCallback(
    async (acc: AccountInterface) => {
      // display loading
      dispatch({
        type: "set_checking_whitelist",
        isLoading: true,
      });

      return accessControllerContract
        .isAllowed(stringHexToStringDec(acc.address))
        .then((response: CallContractResponse) => {
          dispatch({
            type: "set_is_whitelisted",
            isWhitelisted:
              // @ts-ignore
              parseInt(formatBNToReadableString(response.is_allowed), 10) > 0,
          });
        })
        .catch(() => {
          // Reload check whitelisted
          checkWhitelisted(acc);
        });
    },
    [accessControllerContract]
  );

  const register = React.useCallback(
    async (account: AccountInterface) => {
      const actionLabel = t.whitelist.beta_registration;
      // display loading
      dispatch({
        type: "set_registering",
        isLoading: true,
      });
      return accessControllerContract
        .invoke("register", [])
        .then((response: AddTransactionResponse) => {
          addTransaction(
            response,
            actionLabel,
            () => {
              // On success, check whitelisted
              checkWhitelisted(account);
              dispatch({
                type: "set_registering",
                isLoading: false,
              });
            },
            () => {}
          );
        })
        .catch(() => {
          dispatch({
            type: "set_registering",
            isLoading: false,
          });
          // Update toast to "error"
          displayError(t.common.transaction_rejected_by_user, actionLabel);
        });
    },
    [accessControllerContract, addTransaction, checkWhitelisted, t]
  );

  return {
    isLoadingFreeSlots,
    isCheckingWhitelist,
    isRegistering,
    freeSlots,
    isWhitelisted,
    register,
    checkWhitelisted,
    getFreeSlots,
  };
};

export default useWhitelistManager;
