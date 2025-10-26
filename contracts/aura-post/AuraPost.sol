// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title AuraPost
/// @notice Minimal ERC-721 publisher used in Phase 2 of the Valeu roadmap.
/// @dev Token IDs start at 1 and increment sequentially so the frontend can iterate using totalSupply().
contract AuraPost is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId = 1;
    uint256 private _totalSupply;

    mapping(uint256 => bytes32) private _contentHashes;

    event PostPublished(
        uint256 indexed tokenId,
        address indexed publisher,
        string tokenURI,
        bytes32 contentHash
    );

    constructor() ERC721("AuraPost", "AURA") {}

    /// @notice Publish a new post by minting an NFT to the caller.
    /// @param tokenURI_ Metadata URI (e.g. ipfs:// hash) describing the post.
    /// @param contentHash Hash of the raw post content for integrity checks.
    /// @return tokenId ID assigned to the newly minted post.
    function publish(string memory tokenURI_, bytes32 contentHash) external returns (uint256 tokenId) {
        require(bytes(tokenURI_).length != 0, "AuraPost: tokenURI required");
        require(contentHash != bytes32(0), "AuraPost: contentHash required");

        tokenId = _nextTokenId;
        _nextTokenId += 1;
        _totalSupply += 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _contentHashes[tokenId] = contentHash;

        emit PostPublished(tokenId, msg.sender, tokenURI_, contentHash);
    }

    /// @return The total number of posts minted.
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /// @notice Returns the content hash associated with a token.
    function contentHashOf(uint256 tokenId) external view returns (bytes32) {
        ownerOf(tokenId);
        return _contentHashes[tokenId];
    }

    // --- Overrides required by Solidity ---

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
