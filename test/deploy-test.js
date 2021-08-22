const deployScript = require('../scripts/deploy')
const { ethers } = require("hardhat");
const { expect } = require('chai');
const BN = ethers.BigNumber.from

describe("Deploy Script", () => {
    beforeEach(async () => {
        this.signers = await ethers.getSigners()

        // Creat mock ERC721 for the vault
        const MockERC721Contract = await ethers.getContractFactory("MockERC721", this.signers[10])
        this.MockERC721 = await MockERC721Contract.deploy("MockNFT", "MOCK",)
        await this.MockERC721.deployed()

        // Mint sample ERC721s
        this.MockERC721.mint(this.signers[0].address)
        this.MockERC721.mint(this.signers[1].address)
        this.MockERC721.mint(this.signers[2].address)
        this.MockERC721.mint(this.signers[3].address)

        // Set up config
        const hundredthEther = BN("10000000000000000")
        const oneEther = BN("1000000000000000000")
        const testConfig = {
            ERC20Name: "SimpleFraction",
            ERC20Symbol: "SIMP",
            ERC721Address: this.MockERC721.address,
            idToAmount: {
                0: hundredthEther,
                1: hundredthEther.mul(BN(2)),
                2: oneEther
            }
        }

        // Retrieve deployer,fractionalToken, and vaultContract from deploy script
        // Note: deployer == this.signers[0]
        Object.assign(this, await deployScript(testConfig))
    })

    it("deploys the contracts", async () => {
        console.log()
        expect(this.fractionalToken.deployTransaction).to.not.equal(undefined)
        expect(this.vaultContract.deployTransaction).to.not.equal(undefined)
    })
})
