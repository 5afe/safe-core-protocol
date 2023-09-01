methods {
    function setRegistry(address) external;
    function registry() external returns (address) envfree;
}

rule onlyOwnerCanSetRegistry (method f) filtered {
    f -> f.selector != sig:setRegistry(address).selector
}
{
    address ownerBefore = registry() ;

    calldataarg args; env e;
    f(e, args);

    address ownerAfter =  registry();

    assert ownerBefore == ownerAfter;

}