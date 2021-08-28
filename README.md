# Simple Fractions
A minimal contract for fractionalizing ERC721s into an ERC20.

## Overview
Users can deposit ERC721s into a vault contract and receive freshly minted
ERC20 tokens. The vault can be configured for any number of IDs of an ERC721 with
different mint values set for each ID. Users can withdraw any ERC721 token ID from a
vault if they burn the amount of the ERC20 that was minted for that ERC721 upon
deposit.

Note: This code is tested, but not audited. Use at your own risk.

## Deployment
- Customize the Vault in `scripts/config.js`. Among other attributes, you'll
 specify the ERC721 being fractionalized and the number of tokens minted
 for each ERC721 ID. The ERC20 defined by the contract has a `decimals()` value of `18`.
- Create an `environment.js` at the root with the following format:
```
module.exports = {
    deployerPK:      'g',
    alchemyAPIKey:   'm',
    etherscanAPIKey: 'i'
}
```
- Add your networks to `hardhat.config.js` and set `defaultNetwork` to
the desired deployment network
- Run `npm ci && npm run deploy`

## Usage
`deposit(uint256 _tokenId, address _ERC721)` - Deposits the `_tokenId` ERC721
specified in `_ERC721` in the vault. The vault mints a specified amount of the
Fractional ERC20 to the caller.

`withdraw(uint256 _tokenId)` - Withdraws the `_tokenId` ERC721 to the caller.
The caller also burns the amount of Fractional ERC20 received upon ERC721 deposit.
