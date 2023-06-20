%lang starknet

from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin, BitwiseBuiltin
from starkware.cairo.common.uint256 import (
    Uint256,
    uint256_sub,
    uint256_sqrt,
    uint256_check,
    uint256_lt,
    uint256_le,
)
from starkware.cairo.common.math import assert_not_equal
from starkware.cairo.common.bitwise import bitwise_or
from starkware.cairo.common.bool import TRUE, FALSE
from starkware.starknet.common.syscalls import get_contract_address
from openzeppelin.token.erc20.IERC20 import IERC20
from openzeppelin.token.erc20.library import ERC20, ERC20_balances, ERC20_total_supply
from libraries.library import Library
from libraries.utils.Math import (
    _uint256_is_zero,
    _uint256_mul_checked,
    _uint256_add_checked,
    _uint256_unsigned_div_rem,
)

// Define the minimum liquidity accepted as a first deposit
const MINIMUM_LIQUIDITY = 10 ** 3;

//
// Events
//

@event
func Swap(
    to_address: felt,
    amount_0_in: Uint256,
    amount_1_in: Uint256,
    amount_0_out: Uint256,
    amount_1_out: Uint256,
) {
}

@event
func MintLiquidity(
    to_address: felt, amount_0_in: Uint256, amount_1_in: Uint256, liquidity_minted: Uint256
) {
}

@event
func BurnLiquidity(
    to_address: felt, amount_0_out: Uint256, amount_1_out: Uint256, liquidity_burned: Uint256
) {
}

@event
func Sync(reserve_0: Uint256, reserve_1: Uint256) {
}

//
// Storage
//

@storage_var
func Token0() -> (token_address: felt) {
}

@storage_var
func Token1() -> (token_address: felt) {
}

@storage_var
func Reserve0() -> (balance: Uint256) {
}

@storage_var
func Reserve1() -> (balance: Uint256) {
}

namespace Pool {
    //
    // Constructor
    //

    func initializer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_0_address: felt, token_1_address: felt
    ) {
        // Sort tokens before set the pool
        let (token_0_address, token_1_address) = Library.sortTokens(
            token_0_address, token_1_address
        );
        Token0.write(token_0_address);
        Token1.write(token_1_address);
        return ();
    }

    //
    // Getters
    //

    func getToken0{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        token_address: felt
    ) {
        let (token_address: felt) = Token0.read();
        return (token_address,);
    }

    func getToken1{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        token_address: felt
    ) {
        let (token_address: felt) = Token1.read();
        return (token_address,);
    }

    func getReserves{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
        reserve_token_0: Uint256, reserve_token_1: Uint256
    ) {
        let (reserve_token_0: Uint256) = Reserve0.read();
        let (reserve_token_1: Uint256) = Reserve1.read();
        return (reserve_token_0, reserve_token_1);
    }

    //
    // Externals
    //

    func writeReserve0{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        balance: Uint256
    ) -> () {
        // Check new value
        uint256_check(balance);
        Reserve0.write(balance);
        return ();
    }

    func writeReserve1{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        balance: Uint256
    ) -> () {
        // Check new value
        uint256_check(balance);
        Reserve1.write(balance);
        return ();
    }

    // Mint LP's
    func mint{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        to_address: felt
    ) -> (liquidity_minted: Uint256) {
        alloc_locals;

        local result_liquidity: Uint256;

        let (token_0_address: felt) = getToken0();
        let (token_1_address: felt) = getToken1();
        let (me_address: felt) = get_contract_address();

        // Get tokens balance of the pool
        let (balance_token_0: Uint256) = IERC20.balanceOf(token_0_address, me_address);
        let (balance_token_1: Uint256) = IERC20.balanceOf(token_1_address, me_address);
        // Get reserves of the pool
        let (reserve_token_0, reserve_token_1) = getReserves();
        // Calculate diff between balance & reserve
        let (amount_token_0: Uint256) = uint256_sub(balance_token_0, reserve_token_0);
        let (amount_token_1: Uint256) = uint256_sub(balance_token_1, reserve_token_1);

        // Check if pool is empty
        let (total_supply: Uint256) = ERC20.total_supply();
        let (local supply_is_zero: felt) = _uint256_is_zero(total_supply);

        if (supply_is_zero == TRUE) {
            let min_liquidity: Uint256 = Uint256(low=MINIMUM_LIQUIDITY, high=0);
            let (product: Uint256) = _uint256_mul_checked(amount_token_0, amount_token_1);

            let sqrt: Uint256 = uint256_sqrt(product);
            // Check min liquidity
            let (enough_liquidity) = uint256_lt(min_liquidity, sqrt);
            with_attr error_message("ARFSwap: LIQUIDITY_MINTED < MIN_LIQUIDITY") {
                assert enough_liquidity = TRUE;
            }
            let res: Uint256 = uint256_sub(sqrt, min_liquidity);
            result_liquidity.low = res.low;
            result_liquidity.high = res.high;

            // permanently lock the first MINIMUM_LIQUIDITY tokens
            _mintAndBurn(min_liquidity);

            // Rebind implicit argument
            tempvar syscall_ptr = syscall_ptr;
            tempvar pedersen_ptr = pedersen_ptr;
            tempvar range_check_ptr = range_check_ptr;
        } else {
            let (product_token_0) = _uint256_mul_checked(amount_token_0, total_supply);
            let (product_token_1) = _uint256_mul_checked(amount_token_1, total_supply);

            let (quotient_token_0: Uint256) = _uint256_unsigned_div_rem(
                product_token_0, reserve_token_0, FALSE
            );
            let (quotient_token_1: Uint256) = _uint256_unsigned_div_rem(
                product_token_1, reserve_token_1, FALSE
            );
            let (is_quotient_token_0_lower) = uint256_le(quotient_token_0, quotient_token_1);

            // Get lower result
            if (is_quotient_token_0_lower == TRUE) {
                result_liquidity.low = quotient_token_0.low;
                result_liquidity.high = quotient_token_0.high;
            } else {
                result_liquidity.low = quotient_token_1.low;
                result_liquidity.high = quotient_token_1.high;
            }

            // Rebind implicit argument
            tempvar syscall_ptr = syscall_ptr;
            tempvar pedersen_ptr = pedersen_ptr;
            tempvar range_check_ptr = range_check_ptr;
        }

        // Rebind implicit argument
        tempvar syscall_ptr = syscall_ptr;
        tempvar pedersen_ptr = pedersen_ptr;
        tempvar range_check_ptr = range_check_ptr;

        // Error if liquidity to mint = 0
        let (liquidity_is_zero: felt) = _uint256_is_zero(result_liquidity);
        with_attr error_message("ARFSwap: INSUFFICIENT_LIQUIDITY_MINTED") {
            assert liquidity_is_zero = FALSE;
        }

        // Mint the liquidity
        ERC20._mint(to_address, result_liquidity);

        // Update & sync reserves
        _update(balance_token_0, balance_token_1, reserve_token_0, reserve_token_1);

        // Emit add liquidity event
        MintLiquidity.emit(
            to_address=to_address,
            amount_0_in=amount_token_0,
            amount_1_in=amount_token_1,
            liquidity_minted=result_liquidity,
        );

        return (liquidity_minted=result_liquidity);
    }

    // Burn LP's
    func burn{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        to_address: felt
    ) -> (amount_token_0: Uint256, amount_token_1: Uint256) {
        alloc_locals;
        // Get current pool reserves & tokens
        let (reserve_token_0: Uint256, reserve_token_1: Uint256) = getReserves();
        let (token_0_address: felt) = getToken0();
        let (token_1_address: felt) = getToken1();
        let (me_address: felt) = get_contract_address();

        // Check current pool tokens balance & liquidity
        let (balance_token_0: Uint256) = IERC20.balanceOf(token_0_address, me_address);
        let (balance_token_1: Uint256) = IERC20.balanceOf(token_1_address, me_address);
        let (current_liquidity: Uint256) = ERC20.balance_of(me_address);

        // Mint fee's here
        // let (is_fee_on) = _mintFee(reserve0, reserve1)
        let (total_supply: Uint256) = ERC20.total_supply();

        let (amount_token_0, amount_token_1) = Library.removeLiquidityQuote(
            current_liquidity, balance_token_0, balance_token_1, total_supply
        );

        // Error if liquidity to burn = 0
        let (liquidity_token_0_to_burn_is_zero: felt) = _uint256_is_zero(amount_token_0);
        let (liquidity_token_1_to_burn_is_zero: felt) = _uint256_is_zero(amount_token_1);
        with_attr error_message("ARFSwap: INSUFFICIENT_LIQUIDITY_BURNED") {
            assert liquidity_token_0_to_burn_is_zero = FALSE;
            assert liquidity_token_1_to_burn_is_zero = FALSE;
        }

        // Burn the liquidity
        ERC20._burn(me_address, current_liquidity);
        // Transfer token to address
        _transfer(token_0_address, to_address, amount_token_0);
        _transfer(token_1_address, to_address, amount_token_1);

        // Re-assign balance vars
        let (balance_token_0: Uint256) = IERC20.balanceOf(token_0_address, me_address);
        let (balance_token_1: Uint256) = IERC20.balanceOf(token_1_address, me_address);

        // Update & sync reserves
        _update(balance_token_0, balance_token_1, reserve_token_0, reserve_token_1);

        // if (feeOn) kLast = uint(reserve0).mul(reserve1) // reserve0 and reserve1 are up-to-date
        // Emit remove liquidity event
        BurnLiquidity.emit(
            to_address=to_address,
            amount_0_out=amount_token_0,
            amount_1_out=amount_token_1,
            liquidity_burned=current_liquidity,
        );
        return (amount_token_0, amount_token_1);
    }

    // Swap tokens
    func swap{
        syscall_ptr: felt*,
        pedersen_ptr: HashBuiltin*,
        range_check_ptr,
        bitwise_ptr: BitwiseBuiltin*,
    }(amount_out_token_0: Uint256, amount_out_token_1: Uint256, recipient_address: felt) -> (
        amount_out_received: Uint256
    ) {
        alloc_locals;

        let (me_address: felt) = get_contract_address();
        let (amount_out_token_0_is_zero: felt) = _uint256_is_zero(amount_out_token_0);
        let (amount_out_token_1_is_zero: felt) = _uint256_is_zero(amount_out_token_1);

        // Check that (amount_out_token_0_is_zero | amount_out_token_1_is_zero) > 0
        let (not_empty_output_amount) = bitwise_or(
            amount_out_token_0_is_zero, amount_out_token_1_is_zero
        );
        with_attr error_message("ARFSwap: INSUFFICIENT_OUTPUT_AMOUNT") {
            assert not_empty_output_amount = TRUE;
        }

        // Check enough reserve in pool
        let (reserve_token_0, reserve_token_1) = getReserves();
        let (enough_reserve_token_0: felt) = uint256_lt(amount_out_token_0, reserve_token_0);
        let (enough_reserve_token_1: felt) = uint256_lt(amount_out_token_1, reserve_token_1);
        with_attr error_message("ARFSwap: INSUFFICIENT_LIQUIDITY") {
            assert enough_reserve_token_0 = TRUE;
            assert enough_reserve_token_1 = TRUE;
        }

        // Check swap receiver is not the address of any of the 2 tokens in the pool
        let (token_0_address) = getToken0();
        let (token_1_address) = getToken1();
        with_attr error_message("ARFSwap: INVALID_TO") {
            assert_not_equal(recipient_address, token_0_address);
            assert_not_equal(recipient_address, token_1_address);
        }

        // Amout of token_to received
        local amount_out_received: Uint256;

        // Check which token to transfer
        if (amount_out_token_0_is_zero == TRUE) {
            // Transfer token 1
            _transfer(token_1_address, recipient_address, amount_out_token_1);
            amount_out_received.low = amount_out_token_1.low;
            amount_out_received.high = amount_out_token_1.high;
        } else {
            // Transfer token 0
            _transfer(token_0_address, recipient_address, amount_out_token_0);
            amount_out_received.low = amount_out_token_0.low;
            amount_out_received.high = amount_out_token_0.high;
        }

        tempvar pedersen_ptr = pedersen_ptr;

        // Check input liquidity provided
        let (updated_balance_token_0: Uint256) = IERC20.balanceOf(token_0_address, me_address);
        let (updated_balance_token_1: Uint256) = IERC20.balanceOf(token_1_address, me_address);

        // Calculate amount of token0 transfered to the pool
        local amount_token_0_provided: Uint256;
        let (updated_reserve_token_0: Uint256) = uint256_sub(reserve_token_0, amount_out_token_0);
        let (is_token_0_provided) = uint256_le(updated_reserve_token_0, updated_balance_token_0);
        if (is_token_0_provided == TRUE) {
            let (diff_reserve: Uint256) = uint256_sub(reserve_token_0, amount_out_token_0);
            let (diff_provided) = uint256_sub(updated_balance_token_0, diff_reserve);
            amount_token_0_provided.low = diff_provided.low;
            amount_token_0_provided.high = diff_provided.high;
        } else {
            // No token0 provided
            amount_token_0_provided.low = 0;
            amount_token_0_provided.high = 0;
        }

        // Calculate amount of token1 transfer to the pool
        local amount_token_1_provided: Uint256;
        let (updated_reserve_token_1: Uint256) = uint256_sub(reserve_token_1, amount_out_token_1);
        let (is_token_1_provided) = uint256_le(updated_reserve_token_1, updated_balance_token_1);
        if (is_token_1_provided == TRUE) {
            let (diff_reserve: Uint256) = uint256_sub(reserve_token_1, amount_out_token_1);
            let (diff_provided) = uint256_sub(updated_balance_token_1, diff_reserve);
            amount_token_1_provided.low = diff_provided.low;
            amount_token_1_provided.high = diff_provided.high;
        } else {
            // No token1 provided
            amount_token_1_provided.low = 0;
            amount_token_1_provided.high = 0;
        }

        let (amount_token_0_provided_is_zero: felt) = _uint256_is_zero(amount_token_0_provided);
        let (amount_token_1_provided_is_zero: felt) = _uint256_is_zero(amount_token_1_provided);

        // Check that (amount_token_0_provided_is_zero | amount_token_1_provided_is_zero) > 0
        let (sufficient_liquidity_provided) = bitwise_or(
            amount_token_0_provided_is_zero, amount_token_1_provided_is_zero
        );
        with_attr error_message("ARFSwap: INSUFFICIENT_INPUT_AMOUNT") {
            assert sufficient_liquidity_provided = TRUE;
        }

        // Adjust balance for token 0 (trunc LP fee's)
        let (balance_token_0_mult) = _uint256_mul_checked(
            updated_balance_token_0, Uint256(low=1000, high=0)
        );
        let (amount_token_0_provided_mult) = _uint256_mul_checked(
            amount_token_0_provided, Uint256(low=3, high=0)
        );
        let (amount_token_0_provided_adjusted) = uint256_sub(
            balance_token_0_mult, amount_token_0_provided_mult
        );

        // Adjust balance for token 1 (trunc LP fee's)
        let (balance_token_1_mult) = _uint256_mul_checked(
            updated_balance_token_1, Uint256(low=1000, high=0)
        );
        let (amount_token_1_provided_mult) = _uint256_mul_checked(
            amount_token_1_provided, Uint256(low=3, high=0)
        );
        let (amount_token_1_provided_adjusted) = uint256_sub(
            balance_token_1_mult, amount_token_1_provided_mult
        );

        // Check K constant
        let (product_adjusted) = _uint256_mul_checked(
            amount_token_0_provided_adjusted, amount_token_1_provided_adjusted
        );
        let (product_reserves) = _uint256_mul_checked(reserve_token_0, reserve_token_1);
        let (product_reserve_K_check) = _uint256_mul_checked(
            product_reserves, Uint256(low=1000 ** 2, high=0)
        );

        let (k_check_pass) = uint256_le(product_reserve_K_check, product_adjusted);
        with_attr error_message("ARFSwap: K") {
            assert k_check_pass = TRUE;
        }

        // Update & sync reserves
        _update(updated_balance_token_0, updated_balance_token_1, reserve_token_0, reserve_token_1);

        // Emit swap event
        Swap.emit(
            to_address=recipient_address,
            amount_0_in=amount_token_0_provided,
            amount_1_in=amount_token_1_provided,
            amount_0_out=amount_out_token_0,
            amount_1_out=amount_out_token_1,
        );

        return (amount_out_received,);
    }

    //
    // Internals
    //

    // Burn first batch of tokens when add liquidity for first time
    func _mintAndBurn{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        amount: Uint256
    ) -> (success: felt) {
        alloc_locals;
        // Check amount value
        uint256_check(amount);

        local recipient_address = 0;
        let (balance) = ERC20.balance_of(account=recipient_address);
        // overflow is not possible because sum is guaranteed to be less than total supply
        // which we check for overflow below
        let (new_balance) = _uint256_add_checked(balance, amount);
        ERC20_balances.write(recipient_address, new_balance);

        let (supply) = ERC20.total_supply();
        // Overflow is checked in function
        let (new_supply) = _uint256_add_checked(supply, amount);

        // write new supply
        ERC20_total_supply.write(new_supply);
        return (TRUE,);
    }

    // Transfert local found to receiver
    func _transfer{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        token_address: felt, receiver_address: felt, amount: Uint256
    ) -> (success: felt) {
        let (success: felt) = IERC20.transfer(token_address, receiver_address, amount);
        return (success,);
    }

    // Perform Pool update
    func _update{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
        balance_token_0: Uint256,
        balance_token_1: Uint256,
        reserver_token_0: Uint256,
        reserver_token_1: Uint256,
    ) -> (success: felt) {
        writeReserve0(balance_token_0);
        writeReserve1(balance_token_1);

        // Emit sync event
        Sync.emit(reserve_0=balance_token_0, reserve_1=balance_token_1);
        return (TRUE,);
    }
}
