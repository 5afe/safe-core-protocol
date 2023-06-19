// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;
import "../../external/interfaces/ISafe.sol";


/**
 * @title ISafeProtocolStaticFallbackMethod - An interface that a Safe fallbackhandler should implement
 * @notice In Safe protocol, a fallback handler can be used to add additional functionality to a Safe.
 *         TODO: Add more explaination.
 */
interface ISafeProtocolFallbackMethod {

    /**
     * @notice TODO: Add more explaination
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes 
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external returns (bytes memory result);
}


/**
 * @title ISafeProtocolStaticFallbackMethod - An interface that a Safe fallbackhandler should implement in case when handling static calls
 * @notice In Safe protocol, a fallback handler can be used to add additional functionality to a Safe.
 *         TODO: Add more explaination.
 */
interface ISafeProtocolStaticFallbackMethod {
    
    /**
     * @notice TODO: Add more explaination
     * @param safe A Safe instance
     * @param sender Address of the sender
     * @param value Amount of ETH
     * @param data Arbitrary length bytes 
     * @return result Arbitrary length bytes containing result of the operation
     */
    function handle(ISafe safe, address sender, uint256 value, bytes calldata data) external view returns (bytes memory result);
}
