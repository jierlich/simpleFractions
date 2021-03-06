// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IFractionalToken.sol";

/**
    @title Vault
    @author jierlich
    @notice Stores ERC721s which are fractionalized by minting an ERC20
            Mints ERC20 on receipt
            Burns ERC20 on withdraw
*/

contract Vault is ERC721Holder, Ownable {
    /// @dev Address of the fractionalizing ERC20 token
    address public ERC20;

    /// @dev Address of the ERC721 being fractionalized
    address public ERC721;

    /// @dev ERC721 ID to number of corresponding ERC20 tokens
    mapping(uint256 => uint256) public fungibleAmount;

    /// @param _tokenIds IDs of the ERC721. The keys of _fungibleAmount
    /// @param _fungibleAmount Number of ERC20 corresponding to a specific ERC721. The values of fungibleAmount
    /// @param _ERC20 address of the fractional ERC20 token
    /// @param _ERC721 address of the ERC721 to fractionalize
    constructor(
        uint256[] memory _tokenIds,
        uint256[] memory _fungibleAmount,
        address _ERC20,
        address _ERC721
    ) {
        require(_tokenIds.length == _fungibleAmount.length, "Lists must be the same length");
        ERC20 = _ERC20;
        ERC721 = _ERC721;
        for (uint256 i = 0; i < _tokenIds.length; ++i) {
            fungibleAmount[_tokenIds[i]] = _fungibleAmount[i];
        }
    }

    /// @notice Allows a user to deposit an ERC721 in exchange for minted ERC20s
    /// @param _tokenId ID of the ERC721 to deposit
    /// @param _ERC721 Address of the ERC721 to deposit
    function deposit(uint256 _tokenId, address _ERC721) public {
        require(fungibleAmount[_tokenId] != 0, "This _tokenId can not be deposited");
        require(ERC721 == _ERC721, "Attemping to transfer wrong ERC721");
        IERC721(ERC721).safeTransferFrom(msg.sender, address(this), _tokenId);
        IFractionalToken(ERC20).mint(msg.sender, fungibleAmount[_tokenId]);
    }

    /// @notice Allows a user to withdraw an ERC721 by burning the related ERC20
    /// @param _tokenId ID of the ERC721 to withdraw
    function withdraw(uint256 _tokenId) public {
        require(IERC721(ERC721).ownerOf(_tokenId) == address(this), "ERC721 not deposited");
        IFractionalToken(ERC20).burnFrom(msg.sender, fungibleAmount[_tokenId]);
        IERC721(ERC721).safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    /// @notice Register a new token ID and its corresponding ERC20 value
    /// @param _tokenId ID of the ERC721 token
    /// @param _fungibleAmount Number of ERC20 corresponding to this ERC721 ID
    function addId(uint256 _tokenId, uint256 _fungibleAmount) onlyOwner() public {
        require(fungibleAmount[_tokenId] == 0, "This _tokenId is already registered.");
        fungibleAmount[_tokenId] = _fungibleAmount;
    }
}
