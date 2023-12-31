%lang starknet

from starkware.cairo.common.uint256 import Uint256

@contract_interface
namespace IPoolFactory {
    func getFactory() -> (factory_address: felt) {
    }

    func quote(amount_token_0: Uint256, reserve_token_0: Uint256, reserve_token_1: Uint256) -> (
        amount_token_0: Uint256
    ) {
    }

    func removeLiquidityQuote(
        amount_lp: Uint256,
        reserve_token_0: Uint256,
        reserve_token_1: Uint256,
        total_supply: Uint256,
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
    }

    func removeLiquidityQuoteByPool(amount_lp: Uint256, pool_address: felt) -> (
        token_0_address: felt,
        token_1_address: felt,
        amount_token_0: Uint256,
        amount_token_1: Uint256,
    ) {
    }

    func addLiquidity(
        token_0_address: felt,
        token_1_address: felt,
        amount_0_desired: Uint256,
        amount_1_desired: Uint256,
        amount_0_min: Uint256,
        amount_1_min: Uint256,
    ) -> (liquidity_minted: Uint256) {
    }

    func removeLiquidity(
        token_0_address: felt,
        token_1_address: felt,
        amount_token_0_min: Uint256,
        amount_token_1_min: Uint256,
        liquidity: Uint256,
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
    }

    func swapExactTokensForTokens(
        token_from_address: felt,
        token_to_address: felt,
        amount_token_from: Uint256,
        amount_token_to_min: Uint256,
    ) -> (amount_out_received: Uint256) {
    }

    func swapTokensForExactTokens(
        token_from_address: felt,
        token_to_address: felt,
        amount_token_to: Uint256,
        amount_token_from_max: Uint256,
    ) -> (amount_out_received: Uint256) {
    }

    func updateFactory(new_factory_address: felt) -> (success: felt) {
    }

    func transferOwnership(new_owner: felt) -> (new_owner: felt) {
    }
}
