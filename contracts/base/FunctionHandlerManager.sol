// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {BaseManager} from "./BaseManager.sol";

/**
 * @title This contract manages the function handlers for the Safe Account. The contract stores the
 *        information about Safe account, Function selectr and the function handler contract address.
 */
abstract contract FunctionHandlerManager is BaseManager {
    // Storage
    /** @dev Mapping that stores information about Safe account, function selector, and address of the account.
     */
    mapping(address => mapping(bytes4 => address)) public functionHandlers;

    // Events
    event FunctionHandlerChanged(address indexed safe, bytes4 indexed selector, address indexed functionHandler);

    // Errors
    error AddressDoesNotImplementFunctionHandlerInterface(address functionHandler);

    /**
     * @notice Returns the function handler for a Safe account and function selector.
     * @param safe Address of the Safe account
     * @param selector bytes4 function selector
     * @return functionHandler Address of the contract to be set as a function handler
     */
    function getFunctionHandler(address safe, bytes4 selector) external view returns (address functionHandler) {
        functionHandler = functionHandlers[safe][selector];
    }

    /**
     * @notice Sets the function handler for a Safe account and function selector. The msg.sender must be the account.
     * @param selector bytes4 function selector
     * @param functionHandler Address of the contract to be set as a function handler
     */
    function setFunctionHandler(bytes4 selector, address functionHandler) external onlyPermittedIntegration(functionHandler) {
        if (functionHandler != address(0) && !IERC165(functionHandler).supportsInterface(0x00000000)) {
            revert AddressDoesNotImplementFunctionHandlerInterface(functionHandler);
        }

        functionHandlers[msg.sender][selector] = functionHandler;
        emit FunctionHandlerChanged(msg.sender, selector, functionHandler);
    }

    fallback() external {}
}
