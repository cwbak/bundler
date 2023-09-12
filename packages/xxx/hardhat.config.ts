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
            accounts: ['214d7aeb917409a215cd0590853925b5ced9bdf9d846fff6d26a650da550c013']
        },

        sepolia_alchemy: {
            url: 'https://eth-sepolia.g.alchemy.com/v2/HScPYdzA0rnkjVlhirpV-0Bsh3SlUkvX',
            accounts: ['214d7aeb917409a215cd0590853925b5ced9bdf9d846fff6d26a650da550c013']
        }
    },
    mocha: {
        timeout: 500000
    }
}

export default config
