// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";

/**
 * Fork-based integration checks against a live AuraPost deployment.
 * Set both VALEU_SEPOLIA_RPC_URL and VALEU_POST_ADDRESS to enable.
 */
contract AuraPostSepoliaForkTest is Test {
    function testTotalSupplyMatchesOnchainContract() public {
        string memory rpcUrl = vm.envOr("VALEU_SEPOLIA_RPC_URL", string(""));
        address auraAddress = vm.envOr("VALEU_POST_ADDRESS", address(0));

        if (bytes(rpcUrl).length == 0 || auraAddress == address(0)) {
            emit log("Skipping Sepolia fork test. Provide VALEU_SEPOLIA_RPC_URL and VALEU_POST_ADDRESS.");
            return;
        }

        uint256 forkId = vm.createSelectFork(rpcUrl);
        vm.selectFork(forkId);

        AuraPost aura = AuraPost(auraAddress);
        uint256 supply = aura.totalSupply();

        emit log_named_uint("AuraPost totalSupply()", supply);
        assertGt(supply, 0, "Expected contract to have at least one minted post");
    }
}
