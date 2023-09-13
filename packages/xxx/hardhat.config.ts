import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'

import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.15',
        settings: {
            optimizer: {enabled: true}
        }
    },

    defaultNetwork: process.env.NETWORK || "localhost",

    networks: {
        localhost: {
            url: 'http://localhost:8545/',
        },

        sepolia_stackup: {
            url: 'https://api.stackup.sh/v1/node/02bd7702ac68e37d531b3f387cea0cc73ca3294981ce9b850ea69276ae6ebf46',
            accounts: ['2e5ec44c69022f3142ed1be2f3b44f8178f36a45ecc9c4e1d374e27d8b3fdbf5']
        },

        sepolia_alchemy: {
            url: 'https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX',
            accounts: ['2e5ec44c69022f3142ed1be2f3b44f8178f36a45ecc9c4e1d374e27d8b3fdbf5']
        }
    },
    mocha: {
        timeout: 500000
    }
}

export default config
