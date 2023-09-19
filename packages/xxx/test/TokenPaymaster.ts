process.env.NETWORK = 'sepolia_alchemy'

import {
    EntryPoint,
    EntryPoint__factory,
    SimpleAccountFactory__factory,
    TokenPaymaster__factory, UserOperationStruct
} from "@account-abstraction/contracts";
import {
    BaseAccountAPI,
    ClientConfig,
    DeterministicDeployer,
    ERC4337EthersProvider,
    HttpRpcClient,
    PaymasterAPI,
} from "@account-abstraction/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from 'chai'
import { BigNumberish, ethers, Signer, Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers as hardhat_ethers } from "hardhat";
import { XXXSimpleAccountAPI } from "../src/XXXSimpleAccountAPI";
import { IStakeManager } from "../typechain-types/@account-abstraction/contracts/interfaces/IEntryPoint";
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

//const TokenPaymasterAddress = "0x0cBeaD50Fd91F9b0757dD45cb9b530D4A07CE075" // sepolia
const TokenPaymasterAddress = "0x8a4eAbc8591135F10A6fBf58bb4dCfa207e16cD8" // sepolia

class TokenPaymasterAPI implements PaymasterAPI {
    async getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string | undefined> {
        return TokenPaymasterAddress
    }
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
    const smartAccountAPI = new XXXSimpleAccountAPI({
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

describe('Paymaster', function () {
    this.timeout(500000)

    let entryPoint: EntryPoint
    let detDeployer: any
    let simpleAccountFactoryAddress: string
    let eoaSigner: SignerWithAddress
    let aaSigner: ethers.Wallet
    let accountAddress: string
    let aaProvider: ERC4337EthersProvider

    before(async function () {
        entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, hardhat_ethers.provider)
        detDeployer = new DeterministicDeployer(hardhat_ethers.provider)
        simpleAccountFactoryAddress = await detDeployer.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [entryPoint.address])
        eoaSigner = (await hardhat_ethers.getSigners())[0]
        aaSigner = new Wallet(SmartWalletOwnerPK)

        Config.paymasterAPI = new TokenPaymasterAPI()
        aaProvider = await WrapProvider(hardhat_ethers.provider, Config, aaSigner, SmartAccountIndex)
        accountAddress = await aaProvider.getSigner().getAddress()

        console.log("aaSigner:       %s", aaSigner.address)
        console.log("accountAddress: %s", accountAddress)
    })



    it('Deploy TokenPaymaster', async function () {
        const tokenPaymaster = await new TokenPaymaster__factory(eoaSigner).deploy(simpleAccountFactoryAddress, 'SampleT_T', entryPoint.address)
        console.log("Owner: %s", await tokenPaymaster.owner())
        console.log("TokenPaymaster address : %s", tokenPaymaster.address)

        const tokenDecimals = await tokenPaymaster.decimals()
        let balance = await tokenPaymaster.balanceOf(accountAddress)
        console.log("Balance: %s", ethers.utils.formatUnits(balance, tokenDecimals))

        expect(true).to.be.true
    })



    it('Balance', async function () {
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)
        const tokenDecimals = await tokenPaymaster.decimals()

        let balance = await tokenPaymaster.balanceOf(accountAddress)
        console.log("Balance: %s", ethers.utils.formatUnits(balance, tokenDecimals))
    })



    it('Mint Token', async function () {
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)
        const tokenDecimals = await tokenPaymaster.decimals()

        let balance = await tokenPaymaster.balanceOf(accountAddress)
        console.log("Before Balance: %s", ethers.utils.formatUnits(balance, tokenDecimals))

        const tx = await tokenPaymaster.mintTokens(accountAddress, ethers.utils.parseEther("1"))
        const receipt = await tx.wait(1)
        console.log("Hash = %s", receipt.transactionHash)

        balance = await tokenPaymaster.balanceOf(accountAddress)
        console.log("After Balance:  %s", ethers.utils.formatUnits(balance, tokenDecimals))

        expect(true).to.be.true
    })



    it('Deposit info', async function () {
        const amount = await entryPoint.balanceOf(TokenPaymasterAddress)
        console.log("Amount: %s", ethers.utils.formatEther(amount))

        const info = await entryPoint.getDepositInfo(TokenPaymasterAddress)
        printDepositInfo(info)

        expect(true).to.be.true
    })



    it('Deposit to EntryPoint', async function () {
        console.log("TokenPaymaster address: %s", TokenPaymasterAddress)
        console.log("Before ETH Balance:     %s", await hardhat_ethers.provider.getBalance(eoaSigner.address))

        // Deposit 은 TokenPaymaster 의 ETH 가 아니라, 호출자의 value 가 전달된다.
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)
        const tx = await tokenPaymaster.deposit({value: ethers.utils.parseEther("0.01")})
        const receipt = await tx.wait()
        console.log("Hash: %s", receipt.transactionHash)

        console.log("After ETH Balance:      %s", await hardhat_ethers.provider.getBalance(eoaSigner.address))

        expect(true).to.be.true
    })



    it('Stake', async function () {
        let info = await entryPoint.getDepositInfo(TokenPaymasterAddress)
        printDepositInfo(info)

        const unstakeDelaySec = "86400"
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)
        const tx = await tokenPaymaster.addStake(unstakeDelaySec, {value: ethers.utils.parseEther("0.12")})
        const receipt = await tx.wait()
        console.log("TxHash: %s", receipt.transactionHash)

        info = await entryPoint.getDepositInfo(TokenPaymasterAddress)
        printDepositInfo(info)

        expect(true).to.be.true
    })



    it('Withdraw amount', async function () {
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)
        const tx = await tokenPaymaster.withdrawTo("0xA388C77224106eF77F67ED35d23CC5f3D6b1017b", ethers.utils.parseEther("0.009"))
        const receipt = await tx.wait()
        console.log("TxHash: %s", receipt.transactionHash)
        expect(true).to.be.true
    })



    it('Void function', async function () {
        const tokenPaymaster = await new TokenPaymaster__factory().attach(TokenPaymasterAddress).connect(eoaSigner)

        console.log("Before ETH   Balance (signer): %s", await hardhat_ethers.provider.getBalance(aaSigner.address))
        console.log("Before ETH   Balance:          %s", await hardhat_ethers.provider.getBalance(accountAddress))
        console.log("Before Token Balance:          %s", await tokenPaymaster.balanceOf(accountAddress))

        const ret = await aaProvider.getSigner().sendTransaction({
            from: accountAddress,
            data: "0x",
            to: "0xA388C77224106eF77F67ED35d23CC5f3D6b1017b",
            //value: parseEther('0.007795751479708046'),
            gasLimit: 21000,
        })
        const receipt = await ret.wait()
        console.log("txHash: %s", receipt.transactionHash)

        console.log("After ETH   Balance (signer): %s", await hardhat_ethers.provider.getBalance(aaSigner.address))
        console.log("After ETH   Balance:          %s", await hardhat_ethers.provider.getBalance(accountAddress))
        console.log("After Token Balance:          %s", await tokenPaymaster.balanceOf(accountAddress))

        expect(true).to.be.true
    })
})
