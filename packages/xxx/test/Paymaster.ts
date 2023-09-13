process.env.NETWORK = 'sepolia_alchemy'

import {
    DepositPaymaster__factory,
    EntryPoint,
    EntryPoint__factory,
    SimpleAccountFactory__factory,
    TokenPaymaster__factory, VerifyingPaymaster__factory
} from "@account-abstraction/contracts";
import {
    DeterministicDeployer,
} from "@account-abstraction/sdk/src";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from 'chai'
import { ethers as hardhat_ethers } from "hardhat";
import { VerifyingSignerAddr, VerifyingSignerPK } from "./__common__";


const ENTRY_POINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
const BundlerURL = "http://127.0.0.1:3000/rpc" //https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX"
const TokenPaymasterSalt = 0
const VerifyingPaymasterSalt = 0
const DepositPaymasterSalt = 0

describe('Paymaster', function () {
    this.timeout(500000)

    let entryPoint: EntryPoint
    let detDeployer: any
    let simpleAccountFactoryAddress: string
    let eoaSigner: SignerWithAddress

    before(async function () {
        entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, hardhat_ethers.provider)
        detDeployer = new DeterministicDeployer(hardhat_ethers.provider)
        simpleAccountFactoryAddress = await detDeployer.deterministicDeploy(new SimpleAccountFactory__factory(), 0, [entryPoint.address])
        eoaSigner = (await hardhat_ethers.getSigners())[0]
    })

    it('Deploy VerifyingPaymaster', async function () {
        const verifyingPaymasterAddress = await detDeployer.deterministicDeploy(new VerifyingPaymaster__factory(), VerifyingPaymasterSalt, [entryPoint.address, VerifyingSignerAddr])
        console.log("verifyingPaymaster address : %s", verifyingPaymasterAddress)

        expect(true).to.be.true
    })

    it('Deploy DepositPaymaster', async function () {
        const verifyingPaymasterAddress = await detDeployer.deterministicDeploy(new DepositPaymaster__factory(), DepositPaymasterSalt, [entryPoint.address])
        console.log("DepositPaymaster address : %s", verifyingPaymasterAddress)

        expect(true).to.be.true
    })

    it('Deploy TokenPaymaster', async function () {
        // const tokenPaymaster = await new TokenPaymaster__factory(eoaSigner).deploy(simpleAccountFactoryAddress, 'SampleT_T', entryPoint.address)
        // console.log("tokenPaymaster address: %s", tokenPaymaster.address)

        const tokenPaymasterAddress = await detDeployer.deterministicDeploy(new TokenPaymaster__factory(), TokenPaymasterSalt, [simpleAccountFactoryAddress, 'SampleT_T', entryPoint.address])
        console.log("tokenPaymasterAddress address : %s", tokenPaymasterAddress)

        expect(true).to.be.true
    })
})
