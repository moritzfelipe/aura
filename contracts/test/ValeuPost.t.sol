// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ValeuPost} from "../valeu-post/ValeuPost.sol";

contract ValeuPostTest is Test {
    ValeuPost internal valeuPost;
    address internal publisher = makeAddr("publisher");
    string internal constant TOKEN_URI = "ipfs://example-token";
    bytes32 internal constant CONTENT_HASH = bytes32(uint256(123));

    function setUp() public {
        valeuPost = new ValeuPost();
    }

    function testPublishMintsToSenderAndStoresContentHash() public {
        vm.prank(publisher);

        vm.expectEmit(true, true, true, true, address(valeuPost));
        emit ValeuPost.PostPublished(1, publisher, TOKEN_URI, CONTENT_HASH);

        uint256 tokenId = valeuPost.publish(TOKEN_URI, CONTENT_HASH);

        assertEq(tokenId, 1, "tokenId should start at 1");
        assertEq(valeuPost.totalSupply(), 1, "totalSupply should increment");
        assertEq(valeuPost.ownerOf(tokenId), publisher, "mint recipient incorrect");
        assertEq(valeuPost.contentHashOf(tokenId), CONTENT_HASH, "content hash mismatch");
        assertEq(valeuPost.tokenURI(tokenId), TOKEN_URI, "token URI mismatch");
    }

    function testPublishSequentialIdsAndTotalSupply() public {
        vm.prank(publisher);
        uint256 firstId = valeuPost.publish(TOKEN_URI, CONTENT_HASH);

        address secondPublisher = makeAddr("second");
        vm.prank(secondPublisher);
        uint256 secondId = valeuPost.publish("ipfs://another", bytes32(uint256(456)));

        assertEq(firstId, 1, "first tokenId should be 1");
        assertEq(secondId, 2, "tokenIds should increment sequentially");
        assertEq(valeuPost.totalSupply(), 2, "totalSupply should match minted count");
    }

    function testPublishRequiresTokenURI() public {
        vm.prank(publisher);
        vm.expectRevert(bytes("ValeuPost: tokenURI required"));
        valeuPost.publish("", CONTENT_HASH);
    }

    function testPublishRequiresContentHash() public {
        vm.prank(publisher);
        vm.expectRevert(bytes("ValeuPost: contentHash required"));
        valeuPost.publish(TOKEN_URI, bytes32(0));
    }

    function testContentHashOfRevertsWhenTokenMissing() public {
        vm.expectRevert();
        valeuPost.contentHashOf(42);
}
}
