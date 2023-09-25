// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.18;
import {ISafeProtocol712SignatureValidator} from "../interfaces/Modules.sol";
import {RegistryManager} from "../base/RegistryManager.sol";

abstract contract SignatureValidatorManager is RegistryManager {
    // Storage
    /**
     * @notice Mapping to account address => signatureValidator contract
     */
    mapping(address => address) public signatureValdiators;

    // Events
    event SignatureValidatorChanged(address indexed account, address indexed signatureValidator);

    // Errors
    error SingatureValidatorNotSet(address account);

    /**
     * @notice Sets the signature validator contract for an account
     * @param signatureValidator Address of the signature validator contract
     */
    function setSignatureValidator(address signatureValidator) external onlyAccount {
        if (signatureValidator != address(0)) {
            checkPermittedModule(signatureValidator);
            if (
                !ISafeProtocol712SignatureValidator(signatureValidator).supportsInterface(
                    type(ISafeProtocol712SignatureValidator).interfaceId
                )
            ) revert ContractDoesNotImplementValidInterfaceId(signatureValidator);
        }
        signatureValdiators[msg.sender] = signatureValidator;
    }

    function isValidSignature(
        address account,
        bytes32 _hash,
        bytes32 domainSeparator,
        bytes32 typeHash,
        bytes calldata encodeData,
        bytes calldata payload
    ) external view returns (bytes4 magic) {
        address signatureValidator = signatureValdiators[account];
        if (signatureValidator == address(0)) {
            revert SingatureValidatorNotSet(account);
        }

        checkPermittedModule(signatureValidator);

        return
            ISafeProtocol712SignatureValidator(signatureValidator).isValidSignature(
                account,
                msg.sender,
                _hash,
                domainSeparator,
                typeHash,
                encodeData,
                payload
            );
    }
}
