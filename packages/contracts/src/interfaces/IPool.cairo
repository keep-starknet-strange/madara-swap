%lang starknet

from starkware.cairo.common.uint256 import Uint256

@contract_interface
namespace IPool {
    func name() -> (name: felt) {
    }

    func symbol() -> (symbol: felt) {
    }

    func decimals() -> (decimals: felt) {
    }

    func totalSupply() -> (total_supply: Uint256) {
    }

    func balanceOf(account: felt) -> (balance: Uint256) {
    }

    func allowance(owner_address: felt, spender_address: felt) -> (remaining: Uint256) {
    }

    func getToken0() -> (token_address: felt) {
    }

    func getToken1() -> (token_address: felt) {
    }

    func getReserves() -> (reserve_token_0: Uint256, reserve_token_1: Uint256) {
    }

    func getBatchInfos() -> (
        name: felt,
        symbol: felt,
        decimals: felt,
        total_supply: Uint256,
        token_0_address: felt,
        token_1_address: felt,
        reserve_token_0: Uint256,
        reserve_token_1: Uint256,
    ) {
    }

    func transfer(recipient_address: felt, amount: Uint256) -> (success: felt) {
    }

    func transferFrom(sender_address: felt, recipient_address: felt, amount: Uint256) -> (
        success: felt
    ) {
    }

    func approve(spender_address: felt, amount: Uint256) -> (success: felt) {
    }

    func mint(to_address: felt) -> (liquidity_minted: Uint256) {
    }

    func burn(to_address: felt) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
    }

    func swap(
        amount_out_token_0: Uint256, amount_out_token_1: Uint256, recipient_address: felt
    ) -> (amount_out_received: Uint256) {
    }
}
