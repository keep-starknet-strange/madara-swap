%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.uint256 import Uint256
from libraries.SwapController_base import SwapController
from openzeppelin.access.ownable.library import Ownable
from starkware.cairo.common.bool import TRUE

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt, factory_address: felt
) {
    Ownable.initializer(owner_address);
    SwapController.initializer(factory_address);

    return ();
}

//
// Getters
//

@view
func getFactory{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    factory_address: felt
) {
    let (factory_address) = SwapController.getFactory();

    return (factory_address,);
}

@view
func quote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    amount_token_0: Uint256, reserve_token_0: Uint256, reserve_token_1: Uint256
) -> (amount_token_0: Uint256) {
    let (amount_token_0) = SwapController.quote(amount_token_0, reserve_token_0, reserve_token_1);

    return (amount_token_0,);
}

@view
func removeLiquidityQuote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    amount_lp: Uint256, reserve_token_0: Uint256, reserve_token_1: Uint256, total_supply: Uint256
) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
    let (amount_token_0, amount_token_1) = SwapController.removeLiquidityQuote(
        amount_lp, reserve_token_0, reserve_token_1, total_supply
    );

    return (amount_token_0, amount_token_1);
}

@view
func removeLiquidityQuoteByPool{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    amount_lp: Uint256, pool_address: felt
) -> (
    token_0_address: felt, token_1_address: felt, amount_token_0: Uint256, amount_token_1: Uint256
) {
    let (
        token_0_address, token_1_address, amount_token_0, amount_token_1
    ) = SwapController.removeLiquidityQuoteByPool(amount_lp, pool_address);

    return (token_0_address, token_1_address, amount_token_0, amount_token_1);
}

//
// Externals
//

@external
func addLiquidity{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}(
    token_0_address: felt,
    token_1_address: felt,
    amount_0_desired: Uint256,
    amount_1_desired: Uint256,
    amount_0_min: Uint256,
    amount_1_min: Uint256,
) -> (liquidity_minted: Uint256) {
    let (liquidity_minted: Uint256) = SwapController.addLiquidity(
        token_0_address,
        token_1_address,
        amount_0_desired,
        amount_1_desired,
        amount_0_min,
        amount_1_min,
    );

    return (liquidity_minted,);
}

@external
func removeLiquidity{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_0_address: felt,
    token_1_address: felt,
    amount_token_0_min: Uint256,
    amount_token_1_min: Uint256,
    liquidity: Uint256,
) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
    let (amount_token_0: Uint256, amount_token_1: Uint256) = SwapController.removeLiquidity(
        token_0_address, token_1_address, amount_token_0_min, amount_token_1_min, liquidity
    );
    return (amount_token_0, amount_token_1);
}

@external
func swapExactTokensForTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_from_address: felt,
    token_to_address: felt,
    amount_token_from: Uint256,
    amount_token_to_min: Uint256,
) -> (amount_out_received: Uint256) {
    let (amount_out_received) = SwapController.swapExactTokensForTokens(
        token_from_address, token_to_address, amount_token_from, amount_token_to_min
    );
    return (amount_out_received,);
}

@external
func swapTokensForExactTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    token_from_address: felt,
    token_to_address: felt,
    amount_token_to: Uint256,
    amount_token_from_max: Uint256,
) -> (amount_out_received: Uint256) {
    let (amount_out_received) = SwapController.swapTokensForExactTokens(
        token_from_address, token_to_address, amount_token_to, amount_token_from_max
    );
    return (amount_out_received,);
}

@external
func updateFactory{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_factory_address: felt
) -> (success: felt) {
    SwapController.updateFactory(new_factory_address);

    return (TRUE,);
}

@external
func transferOwnership{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_owner: felt
) -> (new_owner: felt) {
    Ownable.transfer_ownership(new_owner);

    return (new_owner=new_owner);
}
