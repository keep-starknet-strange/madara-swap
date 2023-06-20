%lang starknet

from libraries.structs.PoolPair import PoolPair

@contract_interface
namespace IPoolFactory {
    func getPool(pair: PoolPair) -> (pool_address: felt) {
    }

    func getPair(pool_address: felt) -> (pair: PoolPair) {
    }

    func getPools() -> (pools_len: felt, pools: felt*) {
    }

    func addManualPool(new_pool_address: felt, token_0_address: felt, token_1_address: felt) -> (
        success: felt
    ) {
    }
}
