const { keccak256, toUtf8Bytes } = require("ethers/lib/utils")
const { ethers } = require("hardhat");
const BN = ethers.BigNumber.from
const config = require('./config')

module.exports = async function () {
    const [ deployer ] = await ethers.getSigners();

    // Create fractionalToken
    console.log(`FractionalToken is being deployed by ${deployer.address}`)
    const fractionalTokenFactory = await ethers.getContractFactory("FractionalToken", deployer)
    const fractionalToken = await fractionalTokenFactory.deploy(config.ERC20Name, config.ERC20Symbol)
    console.log("FractionalToken address:", fractionalToken.address)

    // Create vault
    console.log(`Vault is being deployed by ${deployer.address}`)
    const IDs = Object.keys(config.idToAmount).map(value => BN(value))
    const amounts = Object.values(config.idToAmount)
    const vaultContractFactory = await ethers.getContractFactory("Vault", deployer)
    const vaultContract = await vaultContractFactory.deploy(IDs, amounts, fractionalToken.address, config.ERC721Address)
    console.log("Vault address:", vaultContract.address)

    // Give vault ERC20 minting permissions, revoke others from deployer
    const MINTER_ROLE = keccak256(toUtf8Bytes("MINTER_ROLE"))
    const PAUSER_ROLE = keccak256(toUtf8Bytes("PAUSER_ROLE"))
    await fractionalToken.connect(deployer).grantRole(
        MINTER_ROLE,
        vaultContract.address
    )
    fractionalToken.connect(deployer).renounceRole(
        MINTER_ROLE,
        deployer.address
    )
    fractionalToken.connect(deployer).renounceRole(
        PAUSER_ROLE,
        deployer.address
    )
}
