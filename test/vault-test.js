const { expect } = require("chai")
const { keccak256, toUtf8Bytes } = require("ethers/lib/utils")
const { ethers } = require("hardhat")
const BN = ethers.BigNumber.from

const zero = BN(0)
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

        // Give vault ERC20 minting permissions
        const MINTER_ROLE = keccak256(toUtf8Bytes("MINTER_ROLE"))
        await this.ERC20.connect(this.signers[10]).grantRole(
            MINTER_ROLE,
            this.vault.address
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

    it("performs normal deposits and withdrawals", async () => {
        /*
        This tests verifies the correctness of a few behaviors:
        - contract successfully receives and sends ERC721s
        - contract successfully mints and burns ERC20s
        */

        // Before deposits
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[0].address)
        expect(await this.MockERC721.ownerOf(1)).to.equal(this.signers[1].address)
        expect(await this.ERC20.totalSupply()).to.equal(zero)
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(zero)
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(zero)

        // Signer 0 deposits
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        await this.vault.connect(this.signers[0]).deposit(0, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)
        expect(await this.MockERC721.ownerOf(1)).to.equal(this.signers[1].address)
        expect(await this.ERC20.totalSupply()).to.equal(hundredthEther)
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(hundredthEther)
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(zero)

        // Signer 1 deposits
        this.MockERC721.connect(this.signers[1]).approve(this.vault.address, 1)
        await this.vault.connect(this.signers[1]).deposit(1, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)
        expect(await this.MockERC721.ownerOf(1)).to.equal(this.vault.address)
        expect(await this.ERC20.totalSupply()).to.equal(hundredthEther.mul(BN(3)))
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(hundredthEther)
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(hundredthEther.mul(BN(2)))

        // Signer 1 sends half of tokens to Signer 0
        await this.ERC20.connect(this.signers[1]).transfer(this.signers[0].address, hundredthEther)
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(hundredthEther.mul(BN(2)))
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(hundredthEther)

        // Signer 1 withdraws ERC721 ID 0
        await this.ERC20.connect(this.signers[1]).approve(this.vault.address, hundredthEther)
        await this.vault.connect(this.signers[1]).withdraw(0)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[1].address)
        expect(await this.MockERC721.ownerOf(1)).to.equal(this.vault.address)
        expect(await this.ERC20.totalSupply()).to.equal(hundredthEther.mul(BN(2)))
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(hundredthEther.mul(BN(2)))
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(zero)

        // Signer 0 withdraws ERC721 ID 1
        await this.ERC20.connect(this.signers[0]).approve(this.vault.address, hundredthEther.mul(BN(2)))
        await this.vault.connect(this.signers[0]).withdraw(1)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[1].address)
        expect(await this.MockERC721.ownerOf(1)).to.equal(this.signers[0].address)
        expect(await this.ERC20.totalSupply()).to.equal(zero)
        expect(await this.ERC20.balanceOf(this.signers[0].address)).to.equal(zero)
        expect(await this.ERC20.balanceOf(this.signers[1].address)).to.equal(zero)
    })

    it("deposits and withdraws a single NFT twice", async () => {
        // Deposit 1
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        await this.vault.connect(this.signers[0]).deposit(0, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)

        // Withdraw 1
        await this.ERC20.connect(this.signers[0]).approve(this.vault.address, hundredthEther.mul(BN(2)))
        await this.vault.connect(this.signers[0]).withdraw(0)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[0].address)

        // Deposit 2
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        await this.vault.connect(this.signers[0]).deposit(0, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)

        // Withdraw 2
        await this.vault.connect(this.signers[0]).withdraw(0)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[0].address)
    })

    it("fails to withdraw without enough tokens", async () => {
        // Signer 0 deposits
        this.MockERC721.connect(this.signers[0]).approve(this.vault.address, 0)
        await this.vault.connect(this.signers[0]).deposit(0, this.MockERC721.address)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)

        // Signer 1 fails to withdraw without enough tokens
        await this.ERC20.connect(this.signers[1]).approve(this.vault.address, hundredthEther)
        await expect(
            this.vault.connect(this.signers[1]).withdraw(0)
         ).to.be.revertedWith("User has insufficient amount of ERC20")
         expect(await this.MockERC721.ownerOf(0)).to.equal(this.vault.address)

        // Signer 1 successfully withdraws
        await this.ERC20.connect(this.signers[0]).transfer(this.signers[1].address, hundredthEther)
        await this.vault.connect(this.signers[1]).withdraw(0)
        expect(await this.MockERC721.ownerOf(0)).to.equal(this.signers[1].address)
    })

    it("fails to deposit an unregistered tokenId", async () => {
        await expect(
            this.vault.connect(this.signers[3]).deposit(3, this.MockERC721.address)
         ).to.be.revertedWith("This _tokenId can not be deposited")
    })

    it("fails to withdraw a missing ERC721", async () => {
        await expect(
            this.vault.connect(this.signers[0]).withdraw(3)
         ).to.be.revertedWith("ERC721 not deposited")
    })
})
