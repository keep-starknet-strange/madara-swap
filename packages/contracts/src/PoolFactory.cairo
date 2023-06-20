%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from openzeppelin.access.ownable.library import Ownable
from libraries.PoolFactory_base import PoolFactory
from libraries.structs.PoolPair import PoolPair

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    swap_controller_address: felt
) {
    // TODO until factory contract deployment swap_controller_address = owner address
    alloc_locals;
    Ownable.initializer(swap_controller_address);

    return ();
}

//
// Getters
//

// Get a pool address for a given pool pair
@view
func getPool{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(pair: PoolPair) -> (
    pool_address: felt
) {
    let (pool_address) = PoolFactory.getPool(pair);

    return (pool_address,);
}

// Get a pool pair for a given pool address
@view
func getPair{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    pool_address: felt
) -> (pair: PoolPair) {
    let (pair) = PoolFactory.getPair(pool_address);

    return (pair,);
}

// Get all pools registered
@view
func getPools{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    pools_len: felt, pools: felt*
) {
    let (total_pools, pools) = PoolFactory.getPools();

    return (total_pools, pools);
}

//
// Externalss
//

// Add a new pool manually
// Will be disable when contract deployment from contract is available
@external
func addManualPool{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    new_pool_address: felt, token_0_address: felt, token_1_address: felt
) -> (success: felt) {
    let (success) = PoolFactory.addPool(new_pool_address, token_0_address, token_1_address);

    return (success,);
}
