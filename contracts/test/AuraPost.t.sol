// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";

contract AuraPostTest is Test {
    AuraPost internal auraPost;
    address internal publisher = makeAddr("publisher");
    string internal constant TOKEN_URI = "ipfs://example-token";
    bytes32 internal constant CONTENT_HASH = bytes32(uint256(123));

    function setUp() public {
        auraPost = new AuraPost();
    }

    function testPublishMintsToSenderAndStoresContentHash() public {
        vm.prank(publisher);

        vm.expectEmit(true, true, true, true, address(auraPost));
        emit AuraPost.PostPublished(1, publisher, TOKEN_URI, CONTENT_HASH);

        uint256 tokenId = auraPost.publish(TOKEN_URI, CONTENT_HASH);

        assertEq(tokenId, 1, "tokenId should start at 1");
        assertEq(auraPost.totalSupply(), 1, "totalSupply should increment");
        assertEq(auraPost.ownerOf(tokenId), publisher, "mint recipient incorrect");
        assertEq(auraPost.contentHashOf(tokenId), CONTENT_HASH, "content hash mismatch");
        assertEq(auraPost.tokenURI(tokenId), TOKEN_URI, "token URI mismatch");
    }

    function testPublishSequentialIdsAndTotalSupply() public {
        vm.prank(publisher);
        uint256 firstId = auraPost.publish(TOKEN_URI, CONTENT_HASH);

        address secondPublisher = makeAddr("second");
        vm.prank(secondPublisher);
        uint256 secondId = auraPost.publish("ipfs://another", bytes32(uint256(456)));

        assertEq(firstId, 1, "first tokenId should be 1");
        assertEq(secondId, 2, "tokenIds should increment sequentially");
        assertEq(auraPost.totalSupply(), 2, "totalSupply should match minted count");
    }

    function testPublishRequiresTokenURI() public {
        vm.prank(publisher);
        vm.expectRevert(bytes("AuraPost: tokenURI required"));
        auraPost.publish("", CONTENT_HASH);
    }

    function testPublishRequiresContentHash() public {
        vm.prank(publisher);
        vm.expectRevert(bytes("AuraPost: contentHash required"));
        auraPost.publish(TOKEN_URI, bytes32(0));
    }

    function testContentHashOfRevertsWhenTokenMissing() public {
        vm.expectRevert();
        auraPost.contentHashOf(42);
    }
}
