%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.alloc import alloc
from libraries.library import Library
from libraries.structs.PoolPair import PoolPair
from openzeppelin.access.ownable.library import Ownable
from starkware.cairo.common.bool import TRUE

//
// Events
//

@event
func PoolCreated(pool_address: felt, token_0_address: felt, token_1_address: felt) {
}

//
// Storage
//

// List all liquidity pools
// pool_address -> (token_0_address, token_1_address)
// Assuming token_0_address < token_1_address
@storage_var
func allPairs(pool_address: felt) -> (pair: PoolPair) {
}

// List all liquidity pools
// (token_0_address, token_1_address) -> pool_address
// Assuming token_0_address < token_1_address
@storage_var
func allPools(pair: PoolPair) -> (pool_address: felt) {
}

// Store the total registered pools
@storage_var
func totalPools() -> (total_pools: felt) {
}

// Store adress of pools by index, start at 0
@storage_var
func poolsIndexed(index: felt) -> (pool_address: felt) {
}

namespace PoolFactory {
    //
    // Getters
    //

    // Get a pool for a given pool pair
    func getPool{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        pair: PoolPair
    ) -> (pool_address: felt) {
        let (pool_address) = allPools.read(pair);
        return (pool_address,);
    }

    // Get a pool pair for a given pool address
    func getPair{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        pool_address: felt
    ) -> (pair: PoolPair) {
        let (pair) = allPairs.read(pool_address);
        return (pair,);
    }

    // Get all pools registered
    func getPools{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        pools_len: felt, pools: felt*
    ) {
        alloc_locals;

        // Allocate an array.
        let (local pools: felt*) = alloc();
        let (total_pools) = totalPools.read();

        // Fill pools ptr recursively
        _fillPoolsRecursively(total_pools, pools);

        return (total_pools, pools);
    }

    //
    // Externals
    //

    // Manual pool creation
    // should be remove once cairo implement dynamic contract creation
    func addPool{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        new_pool_address: felt, token_0_address: felt, token_1_address: felt
    ) -> (success: felt) {
        alloc_locals;
        // Only owner can add a manual pool
        Ownable.assert_only_owner();

        // Sort tokens before store it
        let (token_0_address, token_1_address) = Library.sortTokens(
            token_0_address, token_1_address
        );

        // Write the new pool to store
        let (total_pools) = totalPools.read();
        let new_pool_pair = PoolPair(token_0_address, token_1_address);
        poolsIndexed.write(total_pools, new_pool_address);
        allPairs.write(new_pool_address, new_pool_pair);
        allPools.write(new_pool_pair, new_pool_address);
        totalPools.write(total_pools + 1);

        // Emit pool creation event
        PoolCreated.emit(
            pool_address=new_pool_address,
            token_0_address=token_0_address,
            token_1_address=token_1_address,
        );
        return (TRUE,);
    }

    //
    // Internals
    //

    // Read all pools registered by the factory
    // Fill given ptr with pools recursively
    func _fillPoolsRecursively{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        pools_len: felt, pools: felt*
    ) {
        if (pools_len == 0) {
            return ();
        }
        let new_pool_index = pools_len - 1;
        let (next_pool_pair_address) = poolsIndexed.read(new_pool_index);
        assert [pools] = next_pool_pair_address;

        _fillPoolsRecursively(pools_len=pools_len - 1, pools=pools + 1);
        return ();
    }
}
