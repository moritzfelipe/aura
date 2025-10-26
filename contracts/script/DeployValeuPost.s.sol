// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {ValeuPost} from "../valeu-post/ValeuPost.sol";

/**
 * @title DeployValeuPostScript
 * @notice Deploys the ValeuPost contract and optionally mints a single sample post.
 *
 * Environment:
 * - PRIVATE_KEY (uint) required for broadcasting.
 * - VALEU_POST_SAMPLE_URI (string, optional) tokenURI to mint right after deployment.
 * - VALEU_POST_SAMPLE_HASH (bytes32, optional) keccak256 hash associated with the sample URI.
 */
contract DeployValeuPostScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        ValeuPost valeuPost = new ValeuPost();
        vm.stopBroadcast();

        console2.log("Valeu post contract deployed at", address(valeuPost));

        string memory sampleURI = vm.envOr("VALEU_POST_SAMPLE_URI", string(""));
        bytes32 sampleHash = vm.envOr("VALEU_POST_SAMPLE_HASH", bytes32(0));

        if (bytes(sampleURI).length > 0 && sampleHash != bytes32(0)) {
            vm.startBroadcast(deployerKey);
            uint256 tokenId = valeuPost.publish(sampleURI, sampleHash);
            vm.stopBroadcast();

            console2.log("Sample post minted with tokenId", tokenId);
        }
    }
}
