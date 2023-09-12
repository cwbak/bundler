import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'

import fs from 'fs'

import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/src/types/config'

const mnemonicFileName = process.env.MNEMONIC_FILE
let mnemonic = 'test '.repeat(11) + 'junk'
if (mnemonicFileName != null && fs.existsSync(mnemonicFileName)) {
    mnemonic = fs.readFileSync(mnemonicFileName, 'ascii').trim()
}

const infuraUrl = (name: string): string => `https://${name}.infura.io/v3/${process.env.INFURA_ID}`

function getNetwork(url: string): NetworkUserConfig {
    return {
        url,
        accounts: {
            mnemonic
        }
    }
}

function getInfuraNetwork(name: string): NetworkUserConfig {
    return getNetwork(infuraUrl(name))
}

const config: HardhatUserConfig = {
    typechain: {
        outDir: 'src/types',
        target: 'ethers-v5'
    },

    defaultNetwork: process.env.NETWORK || "localhost",

    networks: {
        localhost: {
            url: 'http://localhost:8545/',
            saveDeployments: false
        },

        sepolia_stackup: {
            url: 'https://api.stackup.sh/v1/node/02bd7702ac68e37d531b3f387cea0cc73ca3294981ce9b850ea69276ae6ebf46',
            accounts: ['214d7aeb917409a215cd0590853925b5ced9bdf9d846fff6d26a650da550c013']
        },

        sepolia_alchemy: {
            url: 'https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX',
            accounts: ['214d7aeb917409a215cd0590853925b5ced9bdf9d846fff6d26a650da550c013']
        },

        goerli: getInfuraNetwork('goerli')
    },
    solidity: {
        version: '0.8.15',
        settings: {
            optimizer: {enabled: true}
        }
    }
}

export default config
