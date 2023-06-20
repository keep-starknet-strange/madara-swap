import React, { useEffect } from "react";

import { useStarknet } from "../StarknetProvider";

import type { ContractState } from "./model";
import { CONTRACT_INITIAL_STATE } from "./model";

const useContractManager = (): ContractState => {
  const [state] = React.useState({
    ...CONTRACT_INITIAL_STATE,
  });
  const {
    erc20Contract,
    liquidityPoolContract,
    swapControllerContract,
    accessControllerContract,
    mapperControllerContract,
  } = state;
  const { account, provider } = useStarknet();

  useEffect(() => {
    // Connect the erc20 contract
    erc20Contract.connect(account || provider);
  }, [erc20Contract, account, provider]);

  useEffect(() => {
    // Connect the liquidity pool contract contract
    liquidityPoolContract.connect(account || provider);
  }, [liquidityPoolContract, account, provider]);

  useEffect(() => {
    // Connect the arf controller contract
    swapControllerContract.connect(account || provider);
  }, [swapControllerContract, account, provider]);

  useEffect(() => {
    // Connect the access controller contract
    accessControllerContract.connect(account || provider);
  }, [accessControllerContract, account, provider]);

  useEffect(() => {
    // Connect the access controller contract
    mapperControllerContract.connect(account || provider);
  }, [mapperControllerContract, account, provider]);

  return {
    erc20Contract,
    liquidityPoolContract,
    swapControllerContract,
    accessControllerContract,
    mapperControllerContract,
  };
};

export default useContractManager;
