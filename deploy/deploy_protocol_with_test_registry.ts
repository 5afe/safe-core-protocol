import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer, owner } = await getNamedAccounts();
    const { deploy } = deployments;
    const testRegistry = await deploy("TestSafeProtocolRegistryUnrestricted", {
        from: deployer,
        args: [owner],
        log: true,
        deterministicDeployment: true,
    });

    await deploy("TestSafeProtocolManager", {
        from: deployer,
        args: [owner, testRegistry.address],
        log: true,
        deterministicDeployment: true,
    });
};

deploy.tags = ["test-protocol"];
export default deploy;
