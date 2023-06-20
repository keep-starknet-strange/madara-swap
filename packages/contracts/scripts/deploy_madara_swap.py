# %% Imports
import logging
from asyncio import run
from math import ceil, log

from scripts.constants import COMPILED_CONTRACTS, ETH_TOKEN_ADDRESS, NETWORK, RPC_CLIENT
from scripts.utils import (
    call,
    declare,
    deploy,
    deploy_starknet_account,
    dump_declarations,
    dump_deployments,
    get_starknet_account,
    invoke,
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

    # %% Deploy
    deployments = {}
    deployments["Bitcoin"] = await deploy(
        "ERC20",
        "Bitcoin",  # name
        "BTC",  # symbol
        1000000 * 10**18,  # initial_supply
        account.address,  # owner
    )
    deployments["PoolFactory"] = await deploy(
        "PoolFactory",
        account.address,
    )
    deployments["SwapController"] = await deploy(
        "SwapController",
        account.address,  # owner_address
        deployments["PoolFactory"]["address"],  # factory_address
    )
    dump_deployments(deployments)

    # %% Create a first pool and fill it
    eth_btc_lp = await deploy(
        "Pool",
        "ETH-BTC LP",  # name
        "LP",  # symbol
        deployments["PoolFactory"]["address"],  # factory_address
        ETH_TOKEN_ADDRESS,  # token_0_address
        deployments["Bitcoin"]["address"],  # token_1_address
    )

    await invoke(
        "PoolFactory",
        "addManualPool",
        eth_btc_lp["address"],  #  new_pool_address
        deployments["Bitcoin"]["address"],  # token_0_address
        ETH_TOKEN_ADDRESS,  # token_1_address
    )

    balance_eth = (
        await call(
            "ERC20",
            "balanceOf",
            account.address,
            address=ETH_TOKEN_ADDRESS,
        )
    ).balance

    balance_btc = (
        await call(
            "ERC20",
            "balanceOf",
            account.address,
            address=deployments["Bitcoin"]["address"],
        )
    ).balance
    btc_eth = 15.66
    amount_eth = int(min(balance_btc * btc_eth, balance_eth) * 0.5)
    amount_btc = int(amount_eth * btc_eth)

    await invoke(
        "ERC20",
        "increaseAllowance",
        deployments["SwapController"]["address"],  # spender_address
        int(2**256 - 1),  # added_value
        address=ETH_TOKEN_ADDRESS,
    )
    await invoke(
        "ERC20",
        "increaseAllowance",
        deployments["SwapController"]["address"],  # spender_address
        int(2**256 - 1),  # added_value
        address=deployments["Bitcoin"]["address"],
    )

    await invoke(
        "SwapController",
        "addLiquidity",
        ETH_TOKEN_ADDRESS,  # token_0_address
        deployments["Bitcoin"]["address"],  # token_1_address
        amount_eth,  # amount_0_desired
        amount_btc,  # amount_1_desired
        int(amount_eth * 0.95),  # amount_0_min
        int(amount_btc * 0.95),  # amount_1_min
    )


# %% Run
if __name__ == "__main__":
    run(main())
