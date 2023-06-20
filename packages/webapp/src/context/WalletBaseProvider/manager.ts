import React from "react";
import type { AccountInterface } from "starknet";

import { stringHexToStringDec } from "../../helpers/math";
import { useContract } from "../ContractProvider";

import type { PoolState, TokenState, WalletBaseState } from "./model";

const useWalletBaseManager = (): WalletBaseState => {
  const { erc20Contract } = useContract();

  const getBalance = React.useCallback(
    async (contract: TokenState | PoolState, account: AccountInterface) => {
      erc20Contract.attach(contract.address);
      return erc20Contract.balanceOf(stringHexToStringDec(account.address));
    },
    [erc20Contract]
  );

  return {
    getBalance,
  };
};

export default useWalletBaseManager;
