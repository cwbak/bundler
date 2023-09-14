process.env.NETWORK = 'sepolia_alchemy'

import {
    EntryPoint,
    EntryPoint__factory,
    SimpleAccountFactory__factory,
    TokenPaymaster__factory
} from "@account-abstraction/contracts";
import { DeterministicDeployer, ERC4337EthersProvider, } from "@account-abstraction/sdk";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from 'chai'
import { ethers, Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers as hardhat_ethers } from "hardhat";
import { WrapProvider } from "../src/utils";
import { TokenPaymaster } from "../typechain-types";
import { CONFIG, ENTRY_POINT_ADDRESS, SmartAccountIndex, SmartWalletOwnerPK } from "./__common__";

async function connect(signer: SignerWithAddress): Promise<TokenPaymaster> {
    const tokenPaymasterAddress = "0x0cBeaD50Fd91F9b0757dD45cb9b530D4A07CE075" // sepolia
    return new TokenPaymaster__factory().attach(tokenPaymasterAddress).connect(signer)
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
        aaProvider = await WrapProvider(hardhat_ethers.provider, CONFIG, aaSigner, SmartAccountIndex)
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
        const tokenPaymaster = await connect(eoaSigner)
        const tokenDecimals = await tokenPaymaster.decimals()

        let balance = await tokenPaymaster.balanceOf(accountAddress)
        console.log("Balance: %s", ethers.utils.formatUnits(balance, tokenDecimals))
    })

    it('Mint Token', async function () {
        const tokenPaymaster = await connect(eoaSigner)
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

    it('Void function', async function () {
        const tokenPaymaster = await connect(eoaSigner)

        console.log("Before ETH   Balance (signer): %s", await hardhat_ethers.provider.getBalance(aaSigner.address))
        console.log("Before ETH   Balance:          %s", await hardhat_ethers.provider.getBalance(accountAddress))
        console.log("Before Token Balance:          %s", await tokenPaymaster.balanceOf(accountAddress))

        const ret = await aaProvider.getSigner().sendTransaction({
            from: accountAddress,
            data: "0x",
            to: "0xA388C77224106eF77F67ED35d23CC5f3D6b1017b",
            value: parseEther('0'),
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
