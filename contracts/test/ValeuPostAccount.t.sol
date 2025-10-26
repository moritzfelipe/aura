// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ValeuPost} from "../valeu-post/ValeuPost.sol";
import {ValeuPostAccount} from "../valeu-account/ValeuPostAccount.sol";

contract ValeuPostAccountHarness is ValeuPostAccount {
    uint256 private _chainIdOverride;
    address private _tokenContractOverride;
    uint256 private _tokenIdOverride;

    function setTokenData(uint256 chainId, address tokenContract, uint256 tokenId) external {
        _chainIdOverride = chainId;
        _tokenContractOverride = tokenContract;
        _tokenIdOverride = tokenId;
    }

    function token() public view override returns (uint256, address, uint256) {
        return (_chainIdOverride, _tokenContractOverride, _tokenIdOverride);
    }
}

contract CallReceiver {
    event Ping(address indexed caller, uint256 value, uint256 payload);

    uint256 public lastValue;
    uint256 public lastPayload;
    address public lastCaller;

    function ping(uint256 payload) external payable {
        lastCaller = msg.sender;
        lastValue = msg.value;
        lastPayload = payload;
        emit Ping(msg.sender, msg.value, payload);
    }

    function willRevert() external pure {
        revert("receiver reverted");
    }
}

contract ValeuPostAccountTest is Test {
    ValeuPost internal valeuPost;
    ValeuPostAccountHarness internal account;
    CallReceiver internal receiver;

    uint256 internal ownerKey;
    uint256 internal tokenId;

    function setUp() public {
        valeuPost = new ValeuPost();
        receiver = new CallReceiver();
        account = new ValeuPostAccountHarness();

        ownerKey = uint256(keccak256("owner-private-key"));
        address derivedOwner = vm.addr(ownerKey);
        vm.label(derivedOwner, "tokenOwner");

        vm.prank(derivedOwner);
        tokenId = valeuPost.publish("ipfs://seed", bytes32(uint256(888)));

        account.setTokenData(block.chainid, address(valeuPost), tokenId);
        assertEq(account.owner(), derivedOwner, "owner should resolve from token");
    }

    function testExecuteSucceedsForOwner() public {
        address derivedOwner = vm.addr(ownerKey);
        vm.deal(address(account), 1 ether);

        vm.prank(derivedOwner);
        bytes memory data = abi.encodeWithSelector(receiver.ping.selector, 42);
        account.execute{value: 0}(address(receiver), 0.25 ether, data, 0);

        assertEq(account.state(), 1, "state should increment");
        assertEq(receiver.lastCaller(), address(account), "receiver should see account");
        assertEq(receiver.lastValue(), 0.25 ether, "value forwarded incorrectly");
        assertEq(receiver.lastPayload(), 42, "payload mismatch");
        assertEq(address(account).balance, 0.75 ether, "account ether balance mismatch");
    }

    function testExecuteRevertsForNonOwner() public {
        vm.prank(makeAddr("intruder"));
        vm.expectRevert(bytes("ValeuPostAccount: invalid signer"));
        account.execute(address(receiver), 0, bytes(""), 0);
        assertEq(account.state(), 0, "state should not increment");
    }

    function testExecuteRejectsUnsupportedOperations() public {
        address derivedOwner = vm.addr(ownerKey);
        vm.prank(derivedOwner);
        vm.expectRevert(bytes("ValeuPostAccount: call only"));
        account.execute(address(receiver), 0, bytes(""), 1);
    }

    function testExecuteBubblesTargetRevert() public {
        address derivedOwner = vm.addr(ownerKey);
        vm.prank(derivedOwner);
        vm.expectRevert(bytes("receiver reverted"));
        account.execute(address(receiver), 0, abi.encodeWithSelector(receiver.willRevert.selector), 0);
    }

    function testIsValidSignatureMatchesOwnerSignature() public {
        bytes32 digest = keccak256("valeu-post-account");

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes4 magic = account.isValidSignature(digest, signature);
        assertEq(magic, IERC1271.isValidSignature.selector, "valid signature should return selector");

        (v, r, s) = vm.sign(uint256(keccak256("other")), digest);
        signature = abi.encodePacked(r, s, v);
        magic = account.isValidSignature(digest, signature);
        assertEq(magic, bytes4(0), "invalid signature should return 0");
    }

    function testTokenReturnsBoundCoordinates() public {
        (uint256 chainId, address tokenContract, uint256 boundTokenId) = account.token();
        assertEq(chainId, block.chainid, "chainId mismatch");
        assertEq(tokenContract, address(valeuPost), "token contract mismatch");
        assertEq(boundTokenId, tokenId, "tokenId mismatch");
    }

}
