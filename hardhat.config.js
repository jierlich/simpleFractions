require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const environment = require('./environment')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${environment.alchemyAPIKey}`,
      accounts: [environment.deployerPK]
    },
  },
  solidity: {
    version: "0.8.4",
  },
  etherscan: {
    apiKey: environment.etherscanAPIKey
  }
};
