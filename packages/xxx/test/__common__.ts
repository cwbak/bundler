import { IStakeManager } from "@account-abstraction/contracts";
import { ClientConfig } from "@account-abstraction/sdk";

export const ENTRY_POINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
export const BUNDLER_URL = "http://127.0.0.1:3000/rpc"
//export const BUNDLER_URL = "https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX"

export const SmartWalletOwnerPK = "8b04454a45bed4031edcea52aaa33b2b02365e728c2ed73694eda5d3a142ebb8"
export const SmartAccountIndex = 3

export const VerifyingSignerPK = "9aef02483fbfb893f7ecef0a8df2ce4f6350c4d4714d99ce34a322ba122e7994"
export const VerifyingSignerAddr = "0x98c820809ecFFf1388E76980EA143928185d7Aa7"


export function printDepositInfo(info: IStakeManager.DepositInfoStructOutput) {
    console.log("Deposit info")
    console.log("  amount: %s", info.deposit.toString())
    console.log("  staked: %o", info.staked)
    console.log("  stake:  %s", info.stake.toString())
    console.log("  unstakeDelaySec: %d", info.unstakeDelaySec)
    console.log("  withdrawTime:    %d", info.withdrawTime)
}

