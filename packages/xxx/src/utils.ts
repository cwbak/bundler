import { JsonRpcProvider } from "@ethersproject/providers";

export async function GetBalanceString(provider: JsonRpcProvider, name: string, address: string): Promise<string> {
    const balance = await provider.getBalance(address)
    return `${name.padEnd(15, ' ')}: ${address} (${balance})`
}
