import { EntryPoint__factory, SimpleAccountFactory__factory } from "@account-abstraction/contracts";
import {
    ClientConfig,
    DeterministicDeployer,
    ERC4337EthersProvider,
    HttpRpcClient,
    SimpleAccountAPI
} from "@account-abstraction/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { BigNumberish, Signer } from "ethers";

export async function GetBalanceString(provider: JsonRpcProvider, name: string, address: string): Promise<string> {
    const balance = await provider.getBalance(address)
    return `${name.padEnd(15, ' ')}: ${address} (${balance})`
}

export async function WrapProvider(
    originalProvider: JsonRpcProvider,
    config: ClientConfig,
    originalSigner: Signer = originalProvider.getSigner(),
    index: BigNumberish,
): Promise<ERC4337EthersProvider> {
    const entryPoint = EntryPoint__factory.connect(config.entryPointAddress, originalProvider)
    // Initial SimpleAccount instance is not deployed and exists just for the interface
    const detDeployer = new DeterministicDeployer(originalProvider)

    // salt 는 SimpleAccountFactory 의 salt
    const simpleAccountFactoryAddress = await detDeployer.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [entryPoint.address])

    // index 는 SimpleAccount 의 salt 로 사용된다.
    const smartAccountAPI = new SimpleAccountAPI({
        provider: originalProvider,
        entryPointAddress: entryPoint.address,
        owner: originalSigner,
        factoryAddress: simpleAccountFactoryAddress,
        paymasterAPI: config.paymasterAPI,
        index: index,
    })
    const chainId = await originalProvider.getNetwork().then(net => net.chainId)
    const httpRpcClient = new HttpRpcClient(config.bundlerUrl, config.entryPointAddress, chainId)
    return await new ERC4337EthersProvider(
        chainId,
        config,
        originalSigner,
        originalProvider,
        httpRpcClient,
        entryPoint,
        smartAccountAPI
    ).init()
}
