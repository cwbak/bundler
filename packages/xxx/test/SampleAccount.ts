process.env.NETWORK = 'sepolia_alchemy'

import { expect } from 'chai'
import { parseEther } from "ethers/lib/utils";
import { ethers as hardhat_ethers } from "hardhat";
import { Wallet } from "ethers";
import { GetBalanceString, WrapProvider } from "../src/utils";
import { CONFIG, SmartAccountIndex, SmartWalletOwnerPK } from "./__common__";

describe('SimpleAccount', function () {
    this.timeout(500000)

    it('Send ETH', async function () {
        const eoaSigner = (await hardhat_ethers.getSigners())[0].address
        const aaSigner = new Wallet(SmartWalletOwnerPK)
        const aaProvider = await WrapProvider(hardhat_ethers.provider, CONFIG, aaSigner, SmartAccountIndex)

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
            value: parseEther('0.00001'),
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
