// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";
import {AuraPostAccount} from "../aura-account/AuraPostAccount.sol";

contract AccountBootstrapper {
    constructor(bytes memory runtime) {
        assembly {
            return(add(runtime, 0x20), mload(runtime))
        }
    }
}

contract AuraPostAccountIntegrationTest is Test {
    AuraPost internal auraPost;
    address internal accountImplementation;

    function setUp() public {
        auraPost = new AuraPost();
        accountImplementation = address(new AuraPostAccount());
    }

    function testCreateAccountAndReceiveTip() public {
        address publisher = makeAddr("publisher");
        vm.prank(publisher);
        uint256 tokenId = auraPost.publish("ipfs://integration", bytes32(uint256(12345)));

        address account = _deployAccount(bytes32(tokenId), address(auraPost), tokenId);
        assertGt(account.code.length, 0, "account not deployed");

        AuraPostAccount boundAccount = AuraPostAccount(payable(account));
        (uint256 recordedChainId, address recordedTokenContract, uint256 recordedTokenId) = boundAccount.token();
        assertEq(recordedChainId, block.chainid, "chainId mismatch in account footer");
        assertEq(recordedTokenContract, address(auraPost), "token contract mismatch in account footer");
        assertEq(recordedTokenId, tokenId, "tokenId mismatch in account footer");
        assertEq(boundAccount.owner(), publisher, "owner should resolve to token owner");

        address tipper = makeAddr("tipper");
        uint256 tipAmount = 0.1 ether;
        vm.deal(tipper, tipAmount);
        vm.prank(tipper);
        (bool sent,) = payable(account).call{value: tipAmount}("");
        assertTrue(sent, "tip transfer failed");
        assertEq(account.balance, tipAmount, "tip balance not received");
    }

    function _deployAccount(bytes32 salt, address tokenContract, uint256 tokenId) internal returns (address account) {
        bytes memory runtime = abi.encodePacked(
            hex"363d3d373d3d3d363d73",
            accountImplementation,
            hex"5af43d82803e903d91602b57fd5bf3",
            bytes32(0),
            abi.encode(block.chainid, tokenContract, tokenId)
        );

        account = address(new AccountBootstrapper{salt: salt}(runtime));

        require(account != address(0), "create2 failed");
    }
}
