import { Contract, json } from "starknet";

import accessController from "../../../../contracts/build/AccessController.json";
import ERC20 from "../../../../contracts/build/ERC20.json";
import mapperController from "../../../../contracts/build/MapperController.json";
import pool from "../../../../contracts/build/Pool.json";
import swapController from "../../../../contracts/build/SwapController.json";
import deployments from "../../../../contracts/deployments/katana/deployments.json";

const compiledERC20 = json.parse(JSON.stringify(ERC20.abi));
const compiledPool = json.parse(JSON.stringify(pool.abi));
const compiledSwapController = json.parse(JSON.stringify(swapController.abi));
const compiledAccessController = json.parse(JSON.stringify(accessController));
const compiledMapper = json.parse(JSON.stringify(mapperController));

export interface ContractState {
  erc20Contract: Contract;
  liquidityPoolContract: Contract;
  swapControllerContract: Contract;
  accessControllerContract: Contract;
  mapperControllerContract: Contract;
}

export const CONTRACT_INITIAL_STATE: ContractState = {
  erc20Contract: new Contract(compiledERC20, ""),
  liquidityPoolContract: new Contract(compiledPool, ""),
  swapControllerContract: new Contract(compiledSwapController, deployments.swap_controller.address),
  accessControllerContract: new Contract(compiledAccessController, deployments.swap_controller.address),
  mapperControllerContract: new Contract(compiledMapper, deployments.swap_controller.address),
};
