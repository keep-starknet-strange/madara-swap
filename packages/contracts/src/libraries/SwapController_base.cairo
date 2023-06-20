%lang starknet

from starkware.cairo.common.bool import TRUE, FALSE
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.bitwise import bitwise_and
from starkware.cairo.common.uint256 import Uint256, uint256_le
from starkware.cairo.common.math import assert_not_zero
from starkware.starknet.common.syscalls import get_caller_address
from openzeppelin.token.erc20.IERC20 import IERC20
from openzeppelin.access.ownable.library import Ownable
from libraries.utils.Math import _uint256_is_zero
from interfaces.IPool import IPool
from libraries.library import Library
from interfaces.IPoolFactory import IPoolFactory
from libraries.structs.PoolPair import PoolPair

//
// Events
//

@event
func FactoryUpdated(old_factory_address: felt, new_factory_address: felt) {
}

//
// Storage
//

@storage_var
func factory() -> (factory_address: felt) {
}

namespace SwapController {
    //
    // Constructor
    //

    func initializer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        factory_address: felt
    ) {
        factory.write(factory_address);
        return ();
    }

    //
    // Getters
    //

    func getFactory{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        factory_address: felt
    ) {
        let (factory_address) = factory.read();
        return (factory_address,);
    }

    // Get a quote base on token & reserves
    func quote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_token_0: Uint256, reserve_token_0: Uint256, reserve_token_1: Uint256
    ) -> (amount_token_0: Uint256) {
        let (amount_token_0) = Library.quote(amount_token_0, reserve_token_0, reserve_token_1);

        return (amount_token_0,);
    }

    // Get a quote for remove liquidity call
    func removeLiquidityQuote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_lp: Uint256,
        reserve_token_0: Uint256,
        reserve_token_1: Uint256,
        total_supply: Uint256,
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
        let (amount_token_0, amount_token_1) = Library.removeLiquidityQuote(
            amount_lp, reserve_token_0, reserve_token_1, total_supply
        );

        return (amount_token_0, amount_token_1);
    }

    // Get a quote for remove liquidity call by pool address
    func removeLiquidityQuoteByPool{
        syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr
    }(amount_lp: Uint256, pool_address: felt) -> (
        token_0_address: felt,
        token_1_address: felt,
        amount_token_0: Uint256,
        amount_token_1: Uint256,
    ) {
        alloc_locals;
        let (
            _,
            _,
            _,
            total_supply,
            token_0_address,
            token_1_address,
            reserve_token_0,
            reserve_token_1,
        ) = IPool.getBatchInfos(pool_address);
        let (amount_token_0, amount_token_1) = Library.removeLiquidityQuote(
            amount_lp, reserve_token_0, reserve_token_1, total_supply
        );

        return (token_0_address, token_1_address, amount_token_0, amount_token_1);
    }

    //
    // Externals
    //

    // Call to add liquidity to the pool
    func addLiquidity{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
        bitwise_ptr: BitwiseBuiltin*,
    }(
        token_0_address: felt,
        token_1_address: felt,
        amount_0_desired: Uint256,
        amount_1_desired: Uint256,
        amount_0_min: Uint256,
        amount_1_min: Uint256,
    ) -> (liquidity_minted: Uint256) {
        alloc_locals;
        let (factory_address) = factory.read();
        let (to_address) = get_caller_address();

        // Sort tokens
        let (token_0_address_ordered, token_1_address_ordered) = Library.sortTokens(
            token_0_address, token_1_address
        );
        // Get pool by ordered tokens
        let pair = PoolPair(token_0_address_ordered, token_1_address_ordered);
        let (pool_address) = IPoolFactory.getPool(factory_address, pair);

        // If pool not exists
        with_attr error_message("ARF: POOL_NOT_EXIST") {
            // TODO create a new pool when factory contract deployment available
            assert_not_zero(pool_address);
        }

        // Get liquidity quote
        let (amount_0_optimal, amount_1_optimal) = _addLiquidity(
            pool_address,
            token_0_address,
            token_1_address,
            amount_0_desired,
            amount_1_desired,
            amount_0_min,
            amount_1_min,
        );

        // Transfer tokens to the pool
        IERC20.transferFrom(token_0_address, to_address, pool_address, amount_0_optimal);
        IERC20.transferFrom(token_1_address, to_address, pool_address, amount_1_optimal);

        // Mint LP's
        let (liquidity_minted: Uint256) = IPool.mint(pool_address, to_address);

        return (liquidity_minted,);
    }

    func removeLiquidity{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_0_address: felt,
        token_1_address: felt,
        amount_token_0_min: Uint256,
        amount_token_1_min: Uint256,
        liquidity: Uint256,
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
        alloc_locals;
        let (factory_address) = factory.read();
        let (to_address) = get_caller_address();

        // TODO remove this & uncomment below when dynamic contracts deployment available
        let (token_0_address, token_1_address) = Library.sortTokens(
            token_0_address, token_1_address
        );
        let pair = PoolPair(token_0_address, token_1_address);
        let (pool_address) = IPoolFactory.getPool(factory_address, pair);
        // let (pool_address) = _poolAddressForTokens(token_0_address, token_1_address)

        // Send liquidity token to pool
        IPool.transferFrom(pool_address, to_address, pool_address, liquidity);
        let (amount_token_0, amount_token_1) = IPool.burn(pool_address, to_address);

        // Error if amount_token_0 < amount_token_0_min user desired
        let (sufficient_amount_token_0: felt) = uint256_le(amount_token_0_min, amount_token_0);
        with_attr error_message("ARF: INSUFFICIENT_TOKEN_0_AMOUNT") {
            assert sufficient_amount_token_0 = TRUE;
        }

        // Error if amount_token_1 < amount_token_1_min user desired
        let (sufficient_amount_token_1: felt) = uint256_le(amount_token_1_min, amount_token_1);
        with_attr error_message("ARF: INSUFFICIENT_TOKEN_1_AMOUNT") {
            assert sufficient_amount_token_1 = TRUE;
        }

        // Return optimal tokens received
        return (amount_token_0, amount_token_1);
    }

    func swapExactTokensForTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_from_address: felt,
        token_to_address: felt,
        amount_token_from: Uint256,
        amount_token_to_min: Uint256,
    ) -> (amount_out_received: Uint256) {
        alloc_locals;
        let (factory_address) = factory.read();
        let (swap_recipient_address) = get_caller_address();

        // TODO remove this & uncomment below when dynamic contracts deployment available
        let (token_0_address, token_1_address) = Library.sortTokens(
            token_from_address, token_to_address
        );
        let pair = PoolPair(token_0_address, token_1_address);
        let (pool_address) = IPoolFactory.getPool(factory_address, pair);
        // let (pool_address) = _poolAddressForTokens(token_0_address, token_1_address)

        let (reserve_token_from_address, reserve_token_to_address) = Library.getReserves(
            pool_address, token_from_address, token_to_address
        );
        let (amount_token_to: Uint256) = Library.getAmountOut(
            amount_token_from, reserve_token_from_address, reserve_token_to_address
        );

        // Send amount_token_from to the LP contract
        IERC20.transferFrom(
            token_from_address, swap_recipient_address, pool_address, amount_token_from
        );

        // Bind input for swap call
        local amount_out_token_0: Uint256;
        local amount_out_token_1: Uint256;
        if (token_from_address == token_0_address) {
            amount_out_token_0.low = 0;
            amount_out_token_0.high = 0;
            amount_out_token_1.low = amount_token_to.low;
            amount_out_token_1.high = amount_token_to.high;
        } else {
            amount_out_token_0.low = amount_token_to.low;
            amount_out_token_0.high = amount_token_to.high;
            amount_out_token_1.low = 0;
            amount_out_token_1.high = 0;
        }

        // Swap
        let (amount_received: Uint256) = IPool.swap(
            pool_address, amount_out_token_0, amount_out_token_1, swap_recipient_address
        );

        // Error if amount_out < min amount desired from user
        let (sufficient_amount_token_out: felt) = uint256_le(amount_token_to_min, amount_received);
        with_attr error_message("ARF: INSUFFICIENT_OUT_AMOUNT") {
            assert sufficient_amount_token_out = TRUE;
        }

        // Return the amount of token_to received
        return (amount_received,);
    }

    func swapTokensForExactTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_from_address: felt,
        token_to_address: felt,
        amount_token_to: Uint256,
        amount_token_from_max: Uint256,
    ) -> (amount_out_received: Uint256) {
        alloc_locals;
        let (factory_address) = factory.read();
        let (swap_recipient_address) = get_caller_address();

        // TODO remove this & uncomment below when dynamic contracts deployment available
        let (token_0_address, token_1_address) = Library.sortTokens(
            token_from_address, token_to_address
        );
        let pair = PoolPair(token_0_address, token_1_address);
        let (pool_address) = IPoolFactory.getPool(factory_address, pair);
        // let (pool_address) = _poolAddressForTokens(token_0_address, token_1_address)

        let (reserve_token_0_address, reserve_token_1_address) = Library.getReserves(
            pool_address, token_from_address, token_to_address
        );
        let (amount_token_from: Uint256) = Library.getAmountIn(
            amount_token_to, reserve_token_0_address, reserve_token_1_address
        );

        // Send amount_token_from to the LP contract
        IERC20.transferFrom(
            token_from_address, swap_recipient_address, pool_address, amount_token_from
        );

        // Bind input for swap call
        local amount_out_token_0: Uint256;
        local amount_out_token_1: Uint256;
        if (token_from_address == token_0_address) {
            amount_out_token_0.low = 0;
            amount_out_token_0.high = 0;
            amount_out_token_1.low = amount_token_to.low;
            amount_out_token_1.high = amount_token_to.high;
        } else {
            amount_out_token_0.low = amount_token_to.low;
            amount_out_token_0.high = amount_token_to.high;
            amount_out_token_1.low = 0;
            amount_out_token_1.high = 0;
        }

        // Swap
        let (amount_in: Uint256) = IPool.swap(
            pool_address, amount_out_token_0, amount_out_token_1, swap_recipient_address
        );

        // Error if amount_in > max amount desired from user
        let (sufficient_amount_token_in: felt) = uint256_le(amount_in, amount_token_from_max);
        with_attr error_message("ARF: INSUFFICIENT_OUT_AMOUNT") {
            assert sufficient_amount_token_in = TRUE;
        }

        // Return the amount of token_from to send
        return (amount_in,);
    }

    func updateFactory{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        new_factory_address: felt
    ) -> (success: felt) {
        // Only owner can update the factory
        Ownable.assert_only_owner();
        let (old_factory_address) = factory.read();
        factory.write(new_factory_address);

        // Emit factory updated event
        FactoryUpdated.emit(old_factory_address, new_factory_address);
        return (TRUE,);
    }

    //
    // Internals
    //

    // Only call after ensure the pool exist
    func _addLiquidity{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
        bitwise_ptr: BitwiseBuiltin*,
    }(
        pool_address: felt,
        token_0_address: felt,
        token_1_address: felt,
        amount_0_desired: Uint256,
        amount_1_desired: Uint256,
        amount_0_min: Uint256,
        amount_1_min: Uint256,
    ) -> (amount_0: Uint256, amount_1: Uint256) {
        alloc_locals;

        // Get actual pool reserves
        let (reserve_token_0, reserve_token_1) = Library.getReserves(
            pool_address, token_0_address, token_1_address
        );

        local amount_0: Uint256;
        local amount_1: Uint256;
        let (reserve_0_is_zero) = _uint256_is_zero(reserve_token_0);
        let (reserve_1_is_zero) = _uint256_is_zero(reserve_token_1);
        // Check both reserve are 0
        let (both_reserve_zero) = bitwise_and(reserve_0_is_zero, reserve_1_is_zero);

        // If booth reserve are 0
        if (both_reserve_zero == TRUE) {
            // If reserves are 0 -> put input desired amount
            return (amount_0=amount_0_desired, amount_1=amount_1_desired);
        } else {
            // Get amount 1 quote
            let (amount_1_optimal) = Library.quote(
                amount_0_desired, reserve_token_0, reserve_token_1
            );
            let (is_amount_1_optimal_ok) = uint256_le(amount_1_optimal, amount_1_desired);

            // If optimal quote <= amount desired
            if (is_amount_1_optimal_ok == 1) {
                // Check optimal quote >= user min input
                let (is_amount_1_optimal_ok) = uint256_le(amount_1_min, amount_1_optimal);
                with_attr error_message("ARF: INSUFFICIENT_B_AMOUNT") {
                    assert is_amount_1_optimal_ok = TRUE;
                }
                return (amount_0=amount_0_desired, amount_1=amount_1_optimal);
            } else {
                // Get amount 0 quote
                let (amount_0_optimal) = Library.quote(
                    amount_1_desired, reserve_token_1, reserve_token_0
                );
                let (is_amount_0_optimal_ok) = uint256_le(amount_0_optimal, amount_0_desired);

                // If optimal quote <= amount desired
                assert is_amount_0_optimal_ok = TRUE;
                // Check optimal quote >= user min input
                let (is_amount_0_optimal_ok) = uint256_le(amount_0_min, amount_0_optimal);
                with_attr error_message("ARF: INSUFFICIENT_A_AMOUNT") {
                    assert is_amount_0_optimal_ok = TRUE;
                }
                return (amount_0=amount_0_optimal, amount_1=amount_1_desired);
            }
        }
    }
}
