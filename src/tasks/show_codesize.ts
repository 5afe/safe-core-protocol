import "hardhat-deploy";
import { task, types } from "hardhat/config";
import { loadSolc } from "../utils/solc";

task("codesize", "Displays the codesize of the contracts")
    .addParam("skipcompile", "should not compile before printing size", false, types.boolean, true)
    .addParam("contractname", "name of the contract", undefined, types.string, true)
    .setAction(async (taskArgs, hre) => {
        if (!taskArgs.skipcompile) {
            await hre.run("compile");
        }
        const contracts = await hre.artifacts.getAllFullyQualifiedNames();
        for (const contract of contracts) {
            const artifact = await hre.artifacts.readArtifact(contract);
            if (taskArgs.contractname && taskArgs.contractname !== artifact.contractName) continue;
            console.log(artifact.contractName, Math.max(0, (artifact.deployedBytecode.length - 2) / 2), "bytes (limit is 24576)");
        }
    });

export {};