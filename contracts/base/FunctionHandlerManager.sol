// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ISafeProtocolFunctionHandler} from "../interfaces/Integrations.sol";
import {ISafe} from "../interfaces/Accounts.sol";
import {RegistryManager} from "./RegistryManager.sol";

/**
 * @title FunctionHandlerManager
 * @notice This contract manages the function handlers for the Safe Account. The contract stores the
 *        information about Safe account, bytes4 function selector and the function handler contract address.
 * @dev This contract inherits BaseManager so that `onlyPermittedIntegration` modifier can be used.
 */
abstract contract FunctionHandlerManager is RegistryManager {
    // Storage
    /** @dev Mapping that stores information about Safe account, function selector, and address of the account.
     */
    mapping(address => mapping(bytes4 => address)) public functionHandlers;

    // Events
    event FunctionHandlerChanged(address indexed safe, bytes4 indexed selector, address indexed functionHandler);

    // Errors
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
     *         This function checks if the functionHandler address is listed and not flagged in the registry.
     * @param selector bytes4 function selector
     * @param functionHandler Address of the contract to be set as a function handler
     */
    function setFunctionHandler(bytes4 selector, address functionHandler) external {
        if (functionHandler != address(0)) checkPermittedIntegration(functionHandler);

        // No need to check if functionHandler implements expected interfaceId as check will be done when adding to registry.
        functionHandlers[msg.sender][selector] = functionHandler;
        emit FunctionHandlerChanged(msg.sender, selector, functionHandler);
    }

    /**
     * @notice This fallback handler function checks if a safe (msg.sender) has a function handler enabled.
     *         If enabled, calls handle function and returns the result back.
     *         Currently, the handle(...) function is non-payable and has same signature for both ISafeProtocolFunctionHandler
     *         and ISafeProtocolStaticFunctionHandler. So, ISafeProtocolFunctionHandler.handle is used even for static calls.
     */
    // solhint-disable-next-line no-complex-fallback, payable-fallback
    fallback(bytes calldata) external returns (bytes memory) {
        address safe = msg.sender;
        bytes4 functionSelector = bytes4(msg.data);

        address functionHandler = functionHandlers[safe][functionSelector];

        // Revert if functionHandler is not set
        if (functionHandler == address(0)) {
            revert FunctionHandlerNotSet(safe, functionSelector);
        }

        address sender;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            sender := shr(96, calldataload(sub(calldatasize(), 20)))
        }

        // With safe v1.x, msg.data contains 20 bytes of sender address. Read the sender address by loading last 20 bytes.
        // remove last 20 bytes from calldata and store it in `data`.
        // Keep first 4 bytes (i.e function signature) so that handler contract can infer function identifier.
        return ISafeProtocolFunctionHandler(functionHandler).handle(ISafe(safe), sender, 0, msg.data[0:(msg.data.length - 20)]);
    }
}
