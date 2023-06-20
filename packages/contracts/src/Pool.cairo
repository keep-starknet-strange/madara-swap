%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.bool import TRUE

from openzeppelin.token.erc20.library import ERC20
from libraries.token.Pool_base import Pool

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt, symbol: felt, factory_address: felt, token_0_address: felt, token_1_address: felt
) {
    ERC20.initializer(name, symbol, 18);
    Pool.initializer(token_0_address, token_1_address);

    return ();
}

//
// Getters
//

@view
func name{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (name: felt) {
    let (name) = ERC20.name();

    return (name,);
}

@view
func symbol{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (symbol: felt) {
    let (symbol) = ERC20.symbol();

    return (symbol,);
}

@view
func totalSupply{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    totalSupply: Uint256
) {
    let (totalSupply: Uint256) = ERC20.total_supply();

    return (totalSupply,);
}

@view
func decimals{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    decimals: felt
) {
    let (decimals) = ERC20.decimals();

    return (decimals,);
}

@view
func balanceOf{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    account_address: felt
) -> (balance: Uint256) {
    let (balance: Uint256) = ERC20.balance_of(account_address);

    return (balance,);
}

@view
func allowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt, spender_address: felt
) -> (remaining: Uint256) {
    let (remaining: Uint256) = ERC20.allowance(owner_address, spender_address);

    return (remaining,);
}

@view
func getToken0{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    token_address: felt
) {
    let (token_address: felt) = Pool.getToken0();

    return (token_address,);
}

@view
func getToken1{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    token_address: felt
) {
    let (token_address: felt) = Pool.getToken1();

    return (token_address,);
}

@view
func getReserves{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    reserve_token_0: Uint256, reserve_token_1: Uint256
) {
    let (reserve_token_0, reserve_token_1) = Pool.getReserves();

    return (reserve_token_0, reserve_token_1);
}

@view
func getBatchInfos{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    name: felt,
    symbol: felt,
    decimals: felt,
    total_supply: Uint256,
    token_0_address: felt,
    token_1_address: felt,
    reserve_token_0: Uint256,
    reserve_token_1: Uint256,
) {
    let (name) = ERC20.name();
    let (symbol) = ERC20.symbol();
    let (decimals) = ERC20.decimals();
    let (total_supply) = ERC20.total_supply();
    let (token_0_address) = Pool.getToken0();
    let (token_1_address) = Pool.getToken1();
    let (reserve_token_0, reserve_token_1) = Pool.getReserves();

    return (
        name,
        symbol,
        decimals,
        total_supply,
        token_0_address,
        token_1_address,
        reserve_token_0,
        reserve_token_1,
    );
}

//
// Externals
//

@external
func transfer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    recipient_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.transfer(recipient_address, amount);

    return (TRUE,);
}

@external
func transferFrom{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    sender_address: felt, recipient_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.transfer_from(sender_address, recipient_address, amount);

    return (TRUE,);
}

@external
func approve{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, amount: Uint256
) -> (success: felt) {
    ERC20.approve(spender_address, amount);

    return (TRUE,);
}

@external
func increaseAllowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, added_value: Uint256
) -> (success: felt) {
    ERC20.increase_allowance(spender_address, added_value);

    return (TRUE,);
}

@external
func decreaseAllowance{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    spender_address: felt, subtracted_value: Uint256
) -> (success: felt) {
    ERC20.decrease_allowance(spender_address, subtracted_value);

    return (TRUE,);
}

// Low level function
// Should be called after send token_0 & token_1 amount's to the Pool
@external
func mint{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(to_address: felt) -> (
    liquidity_minted: Uint256
) {
    let (liquidity_minted: Uint256) = Pool.mint(to_address);

    return (liquidity_minted,);
}

// Low level function
// Should be called after send liquidity to the Pool
@external
func burn{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(to_address: felt) -> (
    amount_token_0: Uint256, amount_token_1: Uint256
) {
    let (amount_token_0: Uint256, amount_token_1: Uint256) = Pool.burn(to_address);

    return (amount_token_0, amount_token_1);
}

// Low level function
// Should be called after send token_0 || token_1 amount's to the Pool
@external
func swap{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}(amount_out_token_0: Uint256, amount_out_token_1: Uint256, recipient_address: felt) -> (
    amount_out_received: Uint256
) {
    let (amount_out_received: Uint256) = Pool.swap(
        amount_out_token_0, amount_out_token_1, recipient_address
    );

    return (amount_out_received,);
}
