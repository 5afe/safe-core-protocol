// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

/**
 * @title ISafeProtocolModule - An interface that a Safe module should implement
 */
interface ISafeProtocolModule {
    /**
     * @notice A funtion that returns name of the module
     * @return name string name of the module
     */
    function name() external view returns (string memory name);

    /**
     * @notice A funtion that returns version of the module
     * @return version string version of the module
     */
    function version() external view returns (string memory version);

    /**
     * @notice A funtion that returns version of the module.
     *         TODO: Define types of meta provider and possible values of location in each of the cases.
     * @return providerType uint256 Type of meta provider
     * @return location bytes
     */
    function metaProvider() external view returns (uint256 providerType, bytes memory location);

    /**
     * @notice A function that indicates if the module requires root access to a Safe.
     * @return requiresRootAccess True if root access is required, false otherwise.
     */
    function requiresRootAccess() external view returns (bool requiresRootAccess);
}
