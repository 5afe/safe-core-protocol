// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;

import {SafeProtocolAction, SafeTransaction} from "../../DataTypes.sol";
import {PLUGIN_PERMISSION_EXECUTE_CALL} from "../../common/Constants.sol";
import {IAccount} from "../../interfaces/Accounts.sol";
import {ISafeProtocolManager} from "../../interfaces/Manager.sol";
import {IERC165, ISafeProtocolFunctionHandler, ISafeProtocolPlugin} from "../../interfaces/Modules.sol";
import {UserOperation} from "./interfaces/IERC4337.sol";
import {ISafeProtocol4337Handler} from "./interfaces/ISafeProtocol4337Handler.sol";

contract SafeProtocol4337Module is ISafeProtocolFunctionHandler, ISafeProtocolPlugin {
    uint256 private constant VALIDATION_SIG_SUCCESS = 0;
    uint256 private constant VALIDATION_SIG_FAILURE = 0;

    address payable public immutable entrypoint;

    constructor(address payable _entrypoint) {
        require(_entrypoint != address(0), "invalid entrypoint address");
        entrypoint = _entrypoint;
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(ISafeProtocolFunctionHandler).interfaceId ||
            interfaceId == type(ISafeProtocolPlugin).interfaceId;
    }

    /**
     * @inheritdoc ISafeProtocolFunctionHandler
     */
    function handle(address account, address sender, uint256 value, bytes calldata data) external override returns (bytes memory result) {
        require(sender == entrypoint, "unsupported entrypoint");
        require(value == 0, "not payable");

        ISafeProtocolManager manager = ISafeProtocolManager(msg.sender);
        bytes4 selector = bytes4(data[:4]);
        if (selector == ISafeProtocol4337Handler(account).validateUserOp.selector) {
            (UserOperation memory userOp, bytes32 userOpHash, uint256 missingAccountFunds) = abi.decode(
                data[4:],
                (UserOperation, bytes32, uint256)
            );
            uint256 validationData = _validateUserOp(manager, account, userOp, userOpHash, missingAccountFunds);
            result = abi.encode(validationData);
        } else if (selector == ISafeProtocol4337Handler(account).executeUserOp.selector) {
            (address to, uint256 opValue, bytes memory opData) = abi.decode(data[4:], (address, uint256, bytes));
            _executeUserOp(manager, account, to, opValue, opData);
        }
    }

    /**
     * Validate account operation.
     * @param manager the protocol manager.
     * @param account the account.
     * @param userOp the operation that is about to be executed.
     * @param missingAccountFunds missing funds on the account's deposit in the entrypoint.
     * @return validationData packaged validation data.
     */
    function _validateUserOp(
        ISafeProtocolManager manager,
        address account,
        UserOperation memory userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) internal returns (uint256 validationData) {
        require(bytes4(userOp.callData) == ISafeProtocol4337Handler(account).executeUserOp.selector, "unsupported execution");

        if (missingAccountFunds > 0) {
            manager.transferPrefund(account, entrypoint, missingAccountFunds);
        }

        try IAccount(account).checkSignatures(userOpHash, "", userOp.signature) {
            validationData = VALIDATION_SIG_SUCCESS;
        } catch {
            validationData = VALIDATION_SIG_FAILURE;
        }
    }

    /**
     * Executes a account operation.
     * @param manager the protocol manager.
     * @param account the account.
     * @param to target of the operation.
     * @param value value of the operation.
     * @param data calldata for the operation.
     */
    function _executeUserOp(ISafeProtocolManager manager, address account, address to, uint256 value, bytes memory data) internal {
        SafeTransaction memory transaction;
        {
            transaction.actions = new SafeProtocolAction[](1);
            transaction.actions[0].to = payable(to);
            transaction.actions[0].value = value;
            transaction.actions[0].data = data;
        }
        manager.executeTransaction(account, transaction);
    }

    /**
     * @inheritdoc ISafeProtocolPlugin
     */
    function metadataProvider()
        external
        view
        override(ISafeProtocolFunctionHandler, ISafeProtocolPlugin)
        returns (uint256 providerType, bytes memory location)
    {}

    /**
     * @inheritdoc ISafeProtocolPlugin
     */
    function name() external pure override returns (string memory) {
        return "Safe Protocol ERC-4337 Plugin";
    }

    /**
     * @inheritdoc ISafeProtocolPlugin
     */
    function version() external pure override returns (string memory) {
        return "1";
    }

    /**
     * @inheritdoc ISafeProtocolPlugin
     */
    function requiresPermissions() external pure override returns (uint8 permissions) {
        permissions = PLUGIN_PERMISSION_EXECUTE_CALL;
    }
}
