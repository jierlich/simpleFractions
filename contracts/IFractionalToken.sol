// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

/**
    @title Fractional Token Interface
    @author jierlich
    @notice Token representing a fraction of the NFTs in the vault
*/

interface IFractionalToken {
    function mint(address, uint256) external;
    function burnFrom(address, uint256) external;
    function balanceOf(address) external view returns(uint256);
}
