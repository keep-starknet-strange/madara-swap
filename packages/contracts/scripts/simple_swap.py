# %% Imports
import logging
from asyncio import run

from scripts.constants import ETH_TOKEN_ADDRESS, NETWORK
from scripts.utils import (
    call,
    deploy_starknet_account,
    get_deployments,
    get_starknet_account,
    invoke,
)

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Example swap
    account = await get_starknet_account()
    if NETWORK["name"] in ["madara", "sharingan"] and account.address == 1:
        await deploy_starknet_account(amount=100)

    deployments = get_deployments()
    token_0, token_1 = sorted([ETH_TOKEN_ADDRESS, deployments["Bitcoin"]["address"]])
    pool_address = (
        await call(
            "PoolFactory",
            "getPool",
            {
                "token_0_address": token_0,
                "token_1_address": token_1,
            },
        )
    ).pool_address
    reserve_token_0, reserve_token_1 = await call(
        "Pool", "getReserves", address=pool_address
    )
    reserve_eth, reserve_btc = (
        (reserve_token_0, reserve_token_1)
        if token_0 == ETH_TOKEN_ADDRESS
        else (
            reserve_token_1,
            reserve_token_0,
        )
    )

    account = await get_starknet_account()

    current_balance_eth = (
        await call("ERC20", "balanceOf", account.address, address=ETH_TOKEN_ADDRESS)
    ).balance
    current_balance_btc = (
        await call(
            "ERC20",
            "balanceOf",
            account.address,
            address=deployments["Bitcoin"]["address"],
        )
    ).balance
    amount_eth = int(min(current_balance_eth, reserve_eth) / 100)
    logger.info(
        f"ℹ️  Swapping {amount_eth / 1e18} ETH for BTC with account {account.address}"
    )
    current_allowance = (
        await call(
            "ERC20",
            "allowance",
            account.address,
            deployments["SwapController"]["address"],
            address=ETH_TOKEN_ADDRESS,
        )
    ).remaining

    if amount_eth > current_allowance:
        await invoke(
            "ERC20",
            "increaseAllowance",
            deployments["SwapController"]["address"],
            amount_eth - current_allowance,
            address=ETH_TOKEN_ADDRESS,
        )

    amount_btc = (
        await call(
            "SwapController",
            "quote",
            amount_eth,
            reserve_eth,
            reserve_btc,
        )
    ).amount_token_1
    slippage = 0.1
    await invoke(
        "SwapController",
        "swapExactTokensForTokens",
        ETH_TOKEN_ADDRESS,  # token_from_address
        deployments["Bitcoin"]["address"],  # token_to_address
        amount_eth,  # amount_token_from
        int(amount_btc * (1 - slippage)),  # amount_token_to_min
    )
    new_balance_btc = (
        await call(
            "ERC20",
            "balanceOf",
            account.address,
            address=deployments["Bitcoin"]["address"],
        )
    ).balance
    logger.info(
        f"ℹ️  Swapped {amount_eth / 1e18} ETH for {(new_balance_btc - current_balance_btc) / 1e18} BTC with account {account.address}"
    )


# %% Run
if __name__ == "__main__":
    run(main())
