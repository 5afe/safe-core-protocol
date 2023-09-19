#!/bin/bash

params=("--send_only")

if [[ -n "$CI" ]]; then
    params=()
fi

certoraRun contracts/SafeProtocolManager.sol contracts/SafeProtocolRegistry.sol contracts/test/TestExecutorCertora.sol \
    --verify SafeProtocolManager:certora/specs/Manager.spec \
    --link "SafeProtocolManager:registry=SafeProtocolRegistry" \
    --solc solc8.18 \
    --optimistic_loop \
    --loop_iter 1 \
    --optimistic_hashing \
    --hashing_length_bound 352 \
    --rule_sanity \
    "${params[@]}" \
    --msg "Safe Protocol $1"