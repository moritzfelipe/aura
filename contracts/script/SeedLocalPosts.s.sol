// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";

/**
 * @title SeedLocalPostsScript
 * @notice Mints a helper post into an existing AuraPost contract. Useful when seeding
 *         Anvil or Sepolia with demo content for the curator feed.
 *
 * Environment:
 * - PRIVATE_KEY (uint) – broadcaster key.
 * - AURA_POST_ADDRESS (address) – target AuraPost contract.
 * - AURA_IPFS_URI (string) – tokenURI for the new post (ipfs://CID recommended).
 * - AURA_POST_SAMPLE_HASH (bytes32) – keccak256 hash of the JSON pointed to by the URI.
 */
contract SeedLocalPostsScript is Script {
    function run() external {
        uint256 broadcasterKey = vm.envUint("PRIVATE_KEY");
        address auraPostAddress = vm.envAddress("AURA_POST_ADDRESS");
        string memory tokenURI = vm.envString("AURA_IPFS_URI");
        bytes32 contentHash = vm.envBytes32("AURA_POST_SAMPLE_HASH");

        vm.startBroadcast(broadcasterKey);
        uint256 tokenId = AuraPost(auraPostAddress).publish(tokenURI, contentHash);
        vm.stopBroadcast();

        console2.log("Published sample post", tokenId, "to AuraPost at", auraPostAddress);
    }
}
