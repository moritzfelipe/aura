// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";

/**
 * @title DeployAuraPostScript
 * @notice Deploys the AuraPost contract and optionally mints a single sample post.
 *
 * Environment:
 * - PRIVATE_KEY (uint) required for broadcasting.
 * - AURA_POST_SAMPLE_URI (string, optional) tokenURI to mint right after deployment.
 * - AURA_POST_SAMPLE_HASH (bytes32, optional) keccak256 hash associated with the sample URI.
 */
contract DeployAuraPostScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        AuraPost auraPost = new AuraPost();
        vm.stopBroadcast();

        console2.log("AuraPost deployed at", address(auraPost));

        string memory sampleURI = vm.envOr("AURA_POST_SAMPLE_URI", string(""));
        bytes32 sampleHash = vm.envOr("AURA_POST_SAMPLE_HASH", bytes32(0));

        if (bytes(sampleURI).length > 0 && sampleHash != bytes32(0)) {
            vm.startBroadcast(deployerKey);
            uint256 tokenId = auraPost.publish(sampleURI, sampleHash);
            vm.stopBroadcast();

            console2.log("Sample post minted with tokenId", tokenId);
        }
    }
}
