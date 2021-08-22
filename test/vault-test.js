const { expect } = require("chai")
const { keccak256, toUtf8Bytes } = require("ethers/lib/utils")
const { ethers } = require("hardhat")
const BN = ethers.BigNumber.from

const hundredthEther = BN("10000000000000000")
const oneEther = BN("1000000000000000000")
const testIDs = [BN(0), BN(1), BN(2)]
const testAmounts = [hundredthEther, hundredthEther.mul(BN(2)), oneEther]

describe("Vault", () => {
    beforeEach(async () => {
        this.signers = await ethers.getSigners()

        // Create fractional token
        const ERC20Contract = await ethers.getContractFactory("FractionalToken", this.signers[10])
        this.ERC20 = await ERC20Contract.deploy("SimpleFraction", "SIMP")
        await this.ERC20.deployed()

        // Creat mock ERC721 for the vault
        const MockERC721Contract = await ethers.getContractFactory("MockERC721", this.signers[10])
        this.MockERC721 = await MockERC721Contract.deploy("MockNFT", "MOCK",)
        await this.MockERC721.deployed()

        // Mint sample ERC721s
        this.MockERC721.mint(this.signers[0].address)
        this.MockERC721.mint(this.signers[1].address)
        this.MockERC721.mint(this.signers[2].address)
        this.MockERC721.mint(this.signers[3].address)

        // Create alternative mock ERC721 that does not have a vault
        const AltMockERC721Contract = await ethers.getContractFactory("MockERC721", this.signers[10])
        this.AltMockERC721 = await AltMockERC721Contract.deploy("AltMockNFT", "ALT",)
        await this.AltMockERC721.deployed()
        this.AltMockERC721.mint(this.signers[0].address)

        // Create vault
        const VaultContract = await ethers.getContractFactory("Vault", this.signers[10])
        this.vault = await VaultContract.deploy(testIDs, testAmounts, this.ERC20.address, this.MockERC721.address)

        // Give only vault ERC20 permissions
        const MINTER_ROLE = keccak256(toUtf8Bytes("MINTER_ROLE"))
        const PAUSER_ROLE = keccak256(toUtf8Bytes("PAUSER_ROLE"))
        await this.ERC20.connect(this.signers[10]).grantRole(
            MINTER_ROLE,
            this.vault.address
        )
        this.ERC20.connect(this.signers[10]).renounceRole(
            MINTER_ROLE,
            this.signers[10].address
        )
        this.ERC20.connect(this.signers[10]).renounceRole(
            PAUSER_ROLE,
            this.signers[10].address
        )
    })

    it("checks the user can't deposit an unregistered ID", async () => {
        await expect(
           this.vault.connect(this.signers[3]).deposit(3, this.MockERC721.address)
        ).to.be.revertedWith("This _tokenId can not be deposited")

    })
    it("checks the user can't deposit the wrong NFT", async () => {
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        this.AltMockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        await expect(
           this.vault.connect(this.signers[0]).deposit(0, this.AltMockERC721.address)
        ).to.be.revertedWith("Attemping to transfer wrong ERC721")
    })

    it("performs a normal deposit and withdrawal", async () => {
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
    })
})
