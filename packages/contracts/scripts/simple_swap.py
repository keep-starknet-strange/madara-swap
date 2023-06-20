# %% Imports
import logging
from asyncio import run

from scripts.constants import ETH_TOKEN_ADDRESS, NETWORK
from scripts.utils import call, deploy_starknet_account, get_deployments, invoke

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# %% Main
async def main():
    # %% Example swap
    if NETWORK["name"] in ["madara", "sharingan"]:
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
    amount_token_0 = int(1e18)
    await invoke(
        "ERC20",
        "increaseAllowance",
        deployments["SwapController"]["address"],
        amount_token_0,
        address=token_0,
    )
    amount_token_1 = (
        await call(
            "SwapController",
            "quote",
            amount_token_0,
            reserve_token_0,
            reserve_token_1,
        )
    ).amount_token_1
    slippage = 0.1
    await invoke(
        "SwapController",
        "swapExactTokensForTokens",
        ETH_TOKEN_ADDRESS,  # token_from_address
        deployments["Bitcoin"]["address"],  # token_to_address
        amount_token_0,  # amount_token_from
        int(amount_token_1 * (1 - slippage)),  # amount_token_to_min
    )


# %% Run
if __name__ == "__main__":
    run(main())
