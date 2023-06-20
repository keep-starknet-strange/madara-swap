# %% Imports
import logging
from asyncio import run
from math import ceil, log

from scripts.constants import COMPILED_CONTRACTS, ETH_TOKEN_ADDRESS, NETWORK, RPC_CLIENT
from scripts.utils import (
    declare,
    deploy,
    deploy_starknet_account,
    dump_declarations,
    dump_deployments,
    get_declarations,
    get_starknet_account,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Declarations
    logger.info(
        f"ℹ️  Connected to CHAIN_ID {NETWORK['chain_id'].value.to_bytes(ceil(log(NETWORK['chain_id'].value, 256)), 'big')} "
        f"with RPC {RPC_CLIENT.url}"
    )
    if NETWORK["name"] in ["madara", "sharingan"]:
        await deploy_starknet_account(amount=100)
    account = await get_starknet_account()
    logger.info(f"ℹ️  Using account {hex(account.address)} as deployer")

    class_hash = {
        contract["contract_name"]: await declare(contract["contract_name"])
        for contract in COMPILED_CONTRACTS
    }
    dump_declarations(class_hash)

    # %% Deployments
    class_hash = get_declarations()

    deployments = {}
    deployments["bitcoin"] = await deploy(
        "ERC20",
        "Bitcoin",  # name
        "BTC",  # symbol
        1000000 * 10**18,  # initial_supply
        account.address,  # owner
    )
    deployments["pool_factory"] = await deploy(
        "PoolFactory",
        account.address,  # swap_controller_address
    )
    deployments["swap_controller"] = await deploy(
        "SwapController",
        account.address,  # owner_address
        deployments["pool_factory"]["address"],  # factory_address
    )
    deployments["pool"] = await deploy(
        "Pool",
        "ETH-BTC LP",  # name
        "LP",  # symbol
        deployments["pool_factory"]["address"],  # factory_address
        ETH_TOKEN_ADDRESS,  # token_0_address
        deployments["bitcoin"]["address"],  # token_1_address
    )
    dump_deployments(deployments)


# %% Run
if __name__ == "__main__":
    run(main())
