import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer, owner } = await getNamedAccounts();
    const { deploy } = deployments;
    const registry = await deploy("SafeProtocolRegistry", {
        from: deployer,
        args: [owner],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("SafeProtocolManager", {
        from: deployer,
        args: [owner, registry.address],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("SignatureValidatorManager", {
        from: deployer,
        args: [registry.address, owner],
        log: true,
        deterministicDeployment: true,
    });
};

deploy.tags = ["protocol"];
export default deploy;
