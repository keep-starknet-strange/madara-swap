%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.math import assert_not_equal
from starkware.cairo.common.math_cmp import is_le_felt
from starkware.cairo.common.uint256 import Uint256, uint256_sub, uint256_check
from starkware.cairo.common.bool import TRUE, FALSE
from interfaces.IPool import IPool
from libraries.utils.Math import (
    _uint256_is_zero,
    _uint256_mul_checked,
    _uint256_add_checked,
    _uint256_unsigned_div_rem,
)

namespace Library {
    // Returns sorted token addresses
    func sortTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_A_address: felt, token_B_address: felt
    ) -> (token_0_address: felt, token_1_address: felt) {
        alloc_locals;
        with_attr error_message("Library: IDENTICAL_ADDRESSES") {
            assert_not_equal(token_A_address, token_B_address);
        }
        with_attr error_message("Library: ZERO_ADDRESS") {
            assert_not_equal(token_A_address, 0);
            assert_not_equal(token_B_address, 0);
        }

        let is_token_A_lower = is_le_felt(token_A_address, token_B_address);
        if (is_token_A_lower == TRUE) {
            return (token_0_address=token_A_address, token_1_address=token_B_address);
        } else {
            return (token_0_address=token_B_address, token_1_address=token_A_address);
        }
    }

    // Calculates the deterministic pool address for 2 known tokens without making any external calls
    func poolAddressForTokens{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        factory_address: felt, token_0_address: felt, token_1_address: felt
    ) -> (pool_address: felt) {
        let (token_0_address, token_1_address) = sortTokens(token_0_address, token_1_address);
        // calculate the pool address with create2 cairo equivalent
        return (0,);
    }

    // Given an input amount of an asset and pool reserves, returns the maximum output amount of the other asset
    // With fee management
    func getAmountOut{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_token_from: Uint256, reserve_token_from: Uint256, reserve_token_to: Uint256
    ) -> (amount_token_to: Uint256) {
        alloc_locals;

        // Check inputs
        uint256_check(amount_token_from);
        uint256_check(reserve_token_from);
        uint256_check(reserve_token_to);

        // Check input amount > 0
        let (amount_token_from_is_zero: felt) = _uint256_is_zero(amount_token_from);
        with_attr error_message("Library: INSUFFICIENT_INPUT_AMOUNT") {
            assert amount_token_from_is_zero = FALSE;
        }

        // Check reserves > 0
        let (reserve_token_from_is_zero: felt) = _uint256_is_zero(reserve_token_from);
        let (reserve_token_to_is_zero: felt) = _uint256_is_zero(reserve_token_to);
        with_attr error_message("Library: INSUFFICIENT_LIQUIDITY") {
            assert reserve_token_from_is_zero = FALSE;
            assert reserve_token_to_is_zero = FALSE;
        }

        // Get amount
        let (amount_in_with_fee) = _uint256_mul_checked(
            amount_token_from, Uint256(low=997, high=0)
        );
        let (numerator) = _uint256_mul_checked(amount_in_with_fee, reserve_token_to);
        let (denominator_first) = _uint256_mul_checked(
            reserve_token_from, Uint256(low=1000, high=0)
        );
        let (denominator) = _uint256_add_checked(denominator_first, amount_in_with_fee);
        let (result: Uint256) = _uint256_unsigned_div_rem(numerator, denominator, FALSE);
        return (amount_token_to=result);
    }

    // Given an output amount of an asset and pool reserves, returns a required input amount of the other asset
    // With fee management
    func getAmountIn{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_token_to: Uint256, reserve_token_from: Uint256, reserve_token_to: Uint256
    ) -> (amount_token_from: Uint256) {
        alloc_locals;

        // Check inputs
        uint256_check(amount_token_to);
        uint256_check(reserve_token_from);
        uint256_check(reserve_token_to);

        // Check output amount > 0
        let (amount_token_to_is_zero: felt) = _uint256_is_zero(amount_token_to);
        with_attr error_message("Library: INSUFFICIENT_OUTPUT_AMOUNT") {
            assert amount_token_to_is_zero = FALSE;
        }

        // Check reserves > 0
        let (reserve_token_from_is_zero: felt) = _uint256_is_zero(reserve_token_from);
        let (reserve_token_to_is_zero: felt) = _uint256_is_zero(reserve_token_to);
        with_attr error_message("Library: INSUFFICIENT_LIQUIDITY") {
            assert reserve_token_from_is_zero = FALSE;
            assert reserve_token_to_is_zero = FALSE;
        }

        // Get amount
        let (numerator_first) = _uint256_mul_checked(amount_token_to, reserve_token_from);
        let (numerator) = _uint256_mul_checked(numerator_first, Uint256(low=1000, high=0));
        let (denominator_first) = uint256_sub(reserve_token_to, amount_token_to);
        let (denominator) = _uint256_mul_checked(denominator_first, Uint256(low=997, high=0));
        let (div_result) = _uint256_unsigned_div_rem(numerator, denominator, FALSE);
        let (result) = _uint256_add_checked(div_result, Uint256(low=1, high=0));
        return (amount_token_from=result);
    }

    // Given some amount of an asset and pool reserves -> returns an equivalent amount of the other asset
    func quote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_0: Uint256, reserve_0: Uint256, reserve_1: Uint256
    ) -> (amount_1: Uint256) {
        alloc_locals;

        // Reserve & amount should not be 0
        let (amount_is_zero) = _uint256_is_zero(amount_0);
        let (reserve_0_is_zero) = _uint256_is_zero(reserve_0);
        let (reserve_1_is_zero) = _uint256_is_zero(reserve_1);
        assert amount_is_zero = FALSE;
        assert reserve_0_is_zero = FALSE;
        assert reserve_1_is_zero = FALSE;

        // Calculate the quote
        let (product_amount_reserve) = _uint256_mul_checked(amount_0, reserve_1);
        let (amount_1) = _uint256_unsigned_div_rem(product_amount_reserve, reserve_0, FALSE);

        return (amount_1,);
    }

    // Given some amount of an asset and pool reserves -> returns an equivalent amount of the other asset
    func removeLiquidityQuote{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount_lp: Uint256, reserve_0: Uint256, reserve_1: Uint256, lp_total_supply: Uint256
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
        alloc_locals;

        // Reserve & amount should not be 0
        let (amount_is_zero) = _uint256_is_zero(amount_lp);
        let (reserve_0_is_zero) = _uint256_is_zero(reserve_0);
        let (reserve_1_is_zero) = _uint256_is_zero(reserve_1);
        assert amount_is_zero = FALSE;
        assert reserve_0_is_zero = FALSE;
        assert reserve_1_is_zero = FALSE;

        // Calculate the quote
        let (product_amount_reserve) = _uint256_mul_checked(amount_lp, reserve_0);
        let (amount_token_0) = _uint256_unsigned_div_rem(
            product_amount_reserve, lp_total_supply, FALSE
        );

        let (product_amount_reserve) = _uint256_mul_checked(amount_lp, reserve_1);
        let (amount_token_1) = _uint256_unsigned_div_rem(
            product_amount_reserve, lp_total_supply, FALSE
        );

        return (amount_token_0, amount_token_1);
    }

    // Fetch and sort the reserves for a pair of tokens
    func getReserves{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        pool_address: felt, token_0_address: felt, token_1_address: felt
    ) -> (reserve_token_0: Uint256, reserve_token_1: Uint256) {
        alloc_locals;
        let (token_0_address_sorted, _) = sortTokens(token_0_address, token_1_address);
        let (reserve_token_0_sorted, reserve_token_1_sorted) = IPool.getReserves(pool_address);

        if (token_0_address == token_0_address_sorted) {
            return (reserve_token_0=reserve_token_0_sorted, reserve_token_1=reserve_token_1_sorted);
        } else {
            return (reserve_token_0=reserve_token_1_sorted, reserve_token_1=reserve_token_0_sorted);
        }
    }
}
