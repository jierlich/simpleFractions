// This is an example config file
// Customize it on a case-by-case basis
const { ethers } = require("hardhat");
const BN = ethers.BigNumber.from

const hundredthEther = BN("10000000000000000")
const oneEther = BN("1000000000000000000")

module.exports = {
    ERC20Name: "SimpleFraction",
    ERC20Symbol: "SIMP",
    ERC721Address: "0x18a808dD312736fc75EB967fC61990aF726F04e4",
    idToAmount: {
        0: hundredthEther,
        1: hundredthEther.mul(BN(2)),
        2: oneEther
    }
}
