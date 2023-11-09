import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MODULE_TYPE_FUNCTION_HANDLER, MODULE_TYPE_PLUGIN } from "../src/utils/constants";

const ENTRYPOINT = process.env.SAFE_PROTOCOL_ERC4337_ENTRYPOINT ?? "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { ethers, deployments, getNamedAccounts } = hre;
    const { deployer, owner } = await getNamedAccounts();
    const { deploy } = deployments;

    const registry = await deploy("SafeProtocolRegistry", {
        from: deployer,
        args: [owner],
        log: true,
        deterministicDeployment: true,
    });

    const module = await deploy("SafeProtocol4337Module", {
        from: deployer,
        args: [ENTRYPOINT],
        log: true,
        deterministicDeployment: true,
    });
    await ethers.getContractAt("SafeProtocolRegistry", registry.address).then(async (registry) => {
        const { listedAt } = await registry.check(module.address, ethers.toBeHex(ethers.MaxUint256));
        if (listedAt == 0n) {
            await registry
                .connect(await ethers.getSigner(owner))
                .addModule(module.address, MODULE_TYPE_PLUGIN | MODULE_TYPE_FUNCTION_HANDLER);
        }
    });
};

deploy.tags = ["plugin"];
export default deploy;
