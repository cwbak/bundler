process.env.NETWORK = 'sepolia_alchemy'

import { EntryPoint__factory, SimpleAccountFactory__factory } from "@account-abstraction/contracts";
import {
    ClientConfig,
    DeterministicDeployer,
    ERC4337EthersProvider, HttpRpcClient,
    SimpleAccountAPI
} from "@account-abstraction/sdk/src";
import { JsonRpcProvider } from "@ethersproject/providers";
import { expect } from 'chai'
import { parseEther } from "ethers/lib/utils";
import { ethers as hardhat_ethers } from "hardhat";
import { BigNumberish, Signer, Wallet } from "ethers";
import { GetBalance } from "../src/balance";
import { BUNDLER_URL, ENTRY_POINT_ADDRESS, SmartWalletOwnerPK } from "./__common__";

const SmartAccountIndex = 0

export async function wrapProvider(
    originalProvider: JsonRpcProvider,
    config: ClientConfig,
    originalSigner: Signer = originalProvider.getSigner(),
    index: BigNumberish = SmartAccountIndex,
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


describe('SimpleAccount', function () {
    this.timeout(500000)

    const config: ClientConfig = {
        entryPointAddress: ENTRY_POINT_ADDRESS,
        bundlerUrl: BUNDLER_URL,
    }

    it('Send ETH', async function () {
        const eoaSigner = (await hardhat_ethers.getSigners())[0].address
        const aaSigner = new Wallet(SmartWalletOwnerPK)
        const aaProvider = await wrapProvider(hardhat_ethers.provider, config, aaSigner)

        const accountAddress = await aaProvider.getSigner().getAddress()
        console.log("accountAddress: %s", accountAddress)

        console.log("Balances Before")
        console.log(await GetBalance(hardhat_ethers.provider, "EOA signer", eoaSigner))
        console.log(await GetBalance(hardhat_ethers.provider, "AA signer", aaSigner.address))
        console.log(await GetBalance(hardhat_ethers.provider, "Account Address", accountAddress))

        const ret = await aaProvider.getSigner().sendTransaction({
            from: accountAddress,
            data: "0x",
            to: "0xA388C77224106eF77F67ED35d23CC5f3D6b1017b",
            value: parseEther('0'),
            gasLimit: 21000,
        })

        const receipt = await ret.wait()
        console.log("txHash: %s", receipt.transactionHash)
        // console.log("Logs: %o", receipt.logs)

        console.log("Balances After")
        console.log(await GetBalance(hardhat_ethers.provider, "EOA signer", eoaSigner))
        console.log(await GetBalance(hardhat_ethers.provider, "AA signer", aaSigner.address))
        console.log(await GetBalance(hardhat_ethers.provider, "Account Address", accountAddress))

        expect(true).to.be.true
    })
})
