const deployScript = require('../scripts/deploy')
const { ethers } = require("hardhat");
const { expect } = require('chai');
const BN = ethers.BigNumber.from

const zero = BN("0")
const hundredthEther = BN("10000000000000000")
const oneEther = BN("1000000000000000000")

// Call an async function while supressing generated log messages
async function suppressLogsAsync (fn, input) {
    const logger = console.log
    console.log = () => { return }

    const res = await fn(input)
    console.log = logger
    return res
}

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
        Object.assign(this, await suppressLogsAsync(deployScript, testConfig))
    })

    it("deploys the contracts", async () => {
        console.log()
        expect(this.fractionalToken.deployTransaction).to.not.equal(undefined)
        expect(this.vaultContract.deployTransaction).to.not.equal(undefined)
    })

    it("checks only the vault can mint", async () => {
        // vault minting succeeds
        this.MockERC721.connect(this.signers[0]).approve(this.vaultContract.address, 0)
        await this.vaultContract.connect(this.signers[0]).deposit(0, this.MockERC721.address)

        // deployer minting fails
        await expect(
            this.fractionalToken.connect(this.deployer).mint(this.deployer.address, oneEther)
        ).to.be.revertedWith("ERC20PresetMinterPauser: must have minter role to mint")
    })

    it("checks deployer can not pause", async () => {
        await expect(
            this.fractionalToken.connect(this.deployer).pause()
        ).to.be.revertedWith("ERC20PresetMinterPauser: must have pauser role to pause")
    })

    it("checks sample functionality", async () => {
        // Deposit
        this.MockERC721.connect(this.signers[0]).approve(this.vaultContract.address, 0)
        await this.vaultContract.connect(this.signers[0]).deposit(0, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vaultContract.address)
        expect(await this.fractionalToken.balanceOf(this.signers[0].address)).to.equal(hundredthEther)

        // Transfer
        await this.fractionalToken.connect(this.signers[0]).transfer(this.signers[1].address, hundredthEther)
        expect(await this.fractionalToken.balanceOf(this.signers[0].address)).to.equal(zero)
        expect(await this.fractionalToken.balanceOf(this.signers[1].address)).to.equal(hundredthEther)

        // Withdraw
        await this.fractionalToken.connect(this.signers[1]).approve(this.vaultContract.address, hundredthEther)
        await this.vaultContract.connect(this.signers[1]).withdraw(0)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[1].address)
        expect(await this.fractionalToken.balanceOf(this.signers[1].address)).to.equal(zero)
    })
})
