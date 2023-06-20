%lang starknet

from starkware.cairo.common.uint256 import (
    Uint256,
    uint256_eq,
    uint256_mul,
    uint256_unsigned_div_rem,
    uint256_add,
)
from starkware.cairo.common.bool import TRUE, FALSE

// Check if a uint256 is zero
func _uint256_is_zero{range_check_ptr}(v: Uint256) -> (is_zero: felt) {
    let (is_zero: felt) = uint256_eq(v, Uint256(0, 0));
    return (is_zero,);
}

// Multiplication of 2 uint256, with overflow check
func _uint256_add_checked{range_check_ptr}(a: Uint256, b: Uint256) -> (sum: Uint256) {
    alloc_locals;

    let (sum, carry) = uint256_add(a, b);
    with_attr error_message("Library: Overflow detected") {
        assert carry = 0;
    }
    return (sum,);
}

// Multiplication of 2 uint256, with overflow check
func _uint256_mul_checked{range_check_ptr}(a: Uint256, b: Uint256) -> (product: Uint256) {
    alloc_locals;

    let (product, carry) = uint256_mul(a, b);
    let (in_range) = _uint256_is_zero(carry);
    with_attr error_message("Library: Overflow detected") {
        assert in_range = TRUE;
    }
    return (product,);
}

// Division of 2 uint256, with overflow check
// Round up if round_up == TRUE
func _uint256_unsigned_div_rem{range_check_ptr}(a: Uint256, b: Uint256, round_up: felt) -> (
    res: Uint256
) {
    alloc_locals;

    let (q, r) = uint256_unsigned_div_rem(a, b);
    let (reminder_is_zero: felt) = _uint256_is_zero(r);

    if (reminder_is_zero == TRUE) {
        return (q,);
    } else {
        if (round_up == FALSE) {
            return (q,);
        }
        let (rounded_up, carry) = uint256_add(q, Uint256(low=1, high=0));
        with_attr error_message("Library: Rounding overflow detected") {
            assert carry = 0;
        }
        return (rounded_up,);
    }
}
