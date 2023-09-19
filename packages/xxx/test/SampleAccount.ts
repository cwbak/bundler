process.env.NETWORK = 'sepolia_alchemy'
//process.env.NETWORK = 'localhost'

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
import { BigNumberish, ethers, Signer, Wallet } from "ethers";
import { GetBalanceString } from "../src/utils";
import {
    BUNDLER_URL,
    ENTRY_POINT_ADDRESS,
    printDepositInfo,
    SmartAccountIndex,
    SmartWalletOwnerPK
} from "./__common__";

const Config: ClientConfig = {
    entryPointAddress: ENTRY_POINT_ADDRESS,
    bundlerUrl: BUNDLER_URL,
}

async function WrapProvider(
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

describe('SimpleAccount', function () {
    this.timeout(500000)

    it('Get address', async function () {
        const eoaSigner = (await hardhat_ethers.getSigners())[0].address
        const aaSigner = new Wallet(SmartWalletOwnerPK)
        const aaProvider = await WrapProvider(hardhat_ethers.provider, Config, aaSigner, SmartAccountIndex)

        const accountAddress = await aaProvider.getSigner().getAddress()
        console.log("AccountAddress: %s", accountAddress)

        const entryPoint = EntryPoint__factory.connect(Config.entryPointAddress, hardhat_ethers.provider)
        const amount = await entryPoint.balanceOf(accountAddress)
        console.log("Deposit Amount: %s", ethers.utils.formatEther(amount))

        const info = await entryPoint.getDepositInfo(accountAddress)
        printDepositInfo(info)

        expect(true).to.be.true
    })

    it('Send ETH', async function () {
        const eoaSigner = (await hardhat_ethers.getSigners())[0].address
        const aaSigner = new Wallet(SmartWalletOwnerPK)
        const aaProvider = await WrapProvider(hardhat_ethers.provider, Config, aaSigner, SmartAccountIndex)

        const accountAddress = await aaProvider.getSigner().getAddress()
        console.log("accountAddress: %s", accountAddress)

        console.log("Balances Before")
        console.log(await GetBalanceString(hardhat_ethers.provider, "EOA signer", eoaSigner))
        console.log(await GetBalanceString(hardhat_ethers.provider, "AA signer", aaSigner.address))
        console.log(await GetBalanceString(hardhat_ethers.provider, "Account Address", accountAddress))

        const ret = await aaProvider.getSigner().sendTransaction({
            from: accountAddress,
            data: "0x",
            to: "0xA388C77224106eF77F67ED35d23CC5f3D6b1017b",
            //value: parseEther('0.00001'),
            gasLimit: 21000,
        })

        const receipt = await ret.wait()
        console.log("txHash: %s", receipt.transactionHash)
        // console.log("Logs: %o", receipt.logs)

        console.log("Balances After")
        console.log(await GetBalanceString(hardhat_ethers.provider, "EOA signer", eoaSigner))
        console.log(await GetBalanceString(hardhat_ethers.provider, "AA signer", aaSigner.address))
        console.log(await GetBalanceString(hardhat_ethers.provider, "Account Address", accountAddress))

        expect(true).to.be.true
    })
})
