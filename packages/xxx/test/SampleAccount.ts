process.env.NETWORK = 'sepolia_alchemy'

import { EntryPoint__factory, SimpleAccountFactory__factory } from "@account-abstraction/contracts";
import {
    ClientConfig,
    DeterministicDeployer,
    ERC4337EthersProvider,
    HttpRpcClient,
    SimpleAccountAPI
} from "@account-abstraction/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { expect } from 'chai'
import { parseEther } from "ethers/lib/utils";
import { ethers as hardhat_ethers } from "hardhat";
import { BigNumberish, Signer, Wallet } from "ethers";


const ENTRY_POINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
const BundlerURL = "https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX"
const SmartWalletOwnerPK = "36af6a231fe89af6cdd6ba6afa6aebcbb173703ec35f30a9284dd1c001da3671"

export async function wrapProvider(
    originalProvider: JsonRpcProvider,
    config: ClientConfig,
    originalSigner: Signer = originalProvider.getSigner(),
    index?: BigNumberish,
): Promise<ERC4337EthersProvider> {
    const entryPoint = EntryPoint__factory.connect(config.entryPointAddress, originalProvider)
    // Initial SimpleAccount instance is not deployed and exists just for the interface
    const detDeployer = new DeterministicDeployer(originalProvider)

    // salt 는 SimpleAccountFactory 의 salt
    const SimpleAccountFactory = await detDeployer.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [entryPoint.address])

    // index 는 SimpleAccount 의 salt 로 사용된다.
    const smartAccountAPI = new SimpleAccountAPI({
        provider: originalProvider,
        entryPointAddress: entryPoint.address,
        owner: originalSigner,
        factoryAddress: SimpleAccountFactory,
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


describe('SimpleAccount', function () {
    this.timeout(500000)

    const config: ClientConfig = {
        entryPointAddress: ENTRY_POINT_ADDRESS,
        bundlerUrl: BundlerURL,
    }

    it('Send ETH', async function () {
        const aaSigner = new Wallet(SmartWalletOwnerPK)
        const aaProvider = await wrapProvider(hardhat_ethers.provider, config, aaSigner)

        const accountAddress = await aaProvider.getSigner().getAddress()
        console.log("accountAddress: %s", accountAddress)

        const ret = await aaProvider.getSigner().sendTransaction({
            from: accountAddress,
            data: "0x",
            to: "0xA388C77224106eF77F67ED35d23CC5f3D6b1017b",
            value: parseEther('0.000011')
        })

        const receipt = await ret.wait()
        console.log("txHash: %s", receipt.transactionHash)
        console.log("Logs: %o", receipt.logs)

        expect(true).to.be.true
    })
})
