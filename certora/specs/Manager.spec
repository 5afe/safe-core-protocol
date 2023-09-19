using SafeProtocolRegistry as contractRegistry;
using TestExecutorCertora as testExecutorCertora;

methods {
    function setRegistry(address) external;
    function registry() external returns (address) envfree;

    function _.supportsInterface(bytes4) external => DISPATCHER(true);

    function testExecutorCertora.called() external returns (bool) envfree;
    function contractRegistry.check(address module) external returns (uint64, uint64) envfree;
    function _.execTransactionFromModule(
        address,
        uint256,
        bytes,
        uint8 
    ) external => DISPATCHER(true);

    function _.execTransactionFromModuleReturnData(
        address,
        uint256,
        bytes,
        uint8 
    )  external => DISPATCHER(true);

    function _.preCheck(
        address,
        SafeProtocolManager.SafeTransaction,
        uint256,
        bytes 
    ) external => NONDET;

    function _.postCheck(address, bool, bytes) external => NONDET;

}

rule onlyOwnerCanSetRegistry (method f) filtered {
    f -> f.selector != sig:setRegistry(address).selector
}
{
    address registryBefore = registry();

    calldataarg args; env e;
    f(e, args);

    address registryAfter = registry();

    assert registryBefore == registryAfter;

}

rule onlyEnabledAndListedPluginCanExecuteCall(){
    method f; env e; calldataarg args;

    require(testExecutorCertora.called() == false);

    f(e, args);

    uint64 listedAt;
    uint64 flagged;

    listedAt, flagged = contractRegistry.check(e.msg.sender);

    assert testExecutorCertora.called() => (listedAt > 0 && flagged == 0);
}

rule hooksUpdates(address safe, SafeProtocolManager.SafeTransaction transactionData){

    method f; env e; calldataarg args;
    storage initialStorage = lastStorage;
    executeTransaction(e, safe, transactionData);

    env e2;
    setHooks(e2, 0) at initialStorage;

    executeTransaction@withrevert(e, safe, transactionData);

    assert !lastReverted;
}