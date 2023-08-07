// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {BaseManager} from "./BaseManager.sol";
import {ISafeProtocolFunctionHandler} from "../interfaces/Integrations.sol";
import {ISafe} from "../interfaces/Accounts.sol";

/**
 * @title FunctionHandlerManager
 * @notice This contract manages the function handlers for the Safe Account. The contract stores the
 *        information about Safe account, bytes4 function selector and the function handler contract address.
 * @dev This contract inherits BaseManager so that `onlyPermittedIntegration` modifier can be used.
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
    error FunctionHandlerNotSet(address safe, bytes4 functionSelector);

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
        // No need to check if functionHandler implements expected interfaceId as check will be done when adding to registry.
        functionHandlers[msg.sender][selector] = functionHandler;
        emit FunctionHandlerChanged(msg.sender, selector, functionHandler);
    }

    fallback() external payable {
        address safe = msg.sender;
        bytes4 functionSelector = bytes4(msg.data);

        address functionHandler = functionHandlers[safe][functionSelector];

        // Revert if functionHandler is not set
        if (functionHandler == address(0)) {
            revert FunctionHandlerNotSet(safe, functionSelector);
        }

        bytes memory data = ISafeProtocolFunctionHandler(functionHandler).handle(ISafe(safe), address(0), msg.value, msg.data);
    }

    receive() external payable {}
}
