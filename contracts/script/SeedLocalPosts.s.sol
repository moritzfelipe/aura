// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {AuraPost} from "../aura-post/AuraPost.sol";

interface IERC6551Registry {
    function createAccount(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId)
        external
        returns (address);
}

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
 * - AURA_ERC6551_REGISTRY (address, optional) – registry used to create token-bound accounts.
 * - AURA_ACCOUNT_IMPLEMENTATION (address, optional) – ERC-6551 implementation cloned for each post.
 * - AURA_CREATE_TOKEN_ACCOUNT (bool, optional) – set to "false" to skip ERC-6551 account creation (default true).
 */
contract SeedLocalPostsScript is Script {
    function run() external {
        uint256 broadcasterKey = vm.envUint("PRIVATE_KEY");
        address auraPostAddress = vm.envAddress("AURA_POST_ADDRESS");
        string memory tokenURI = vm.envString("AURA_IPFS_URI");
        bytes32 contentHash = vm.envBytes32("AURA_POST_SAMPLE_HASH");
        address registry = vm.envOr("AURA_ERC6551_REGISTRY", address(0));
        address implementation = vm.envOr("AURA_ACCOUNT_IMPLEMENTATION", address(0));
        bool createAccount = vm.envOr("AURA_CREATE_TOKEN_ACCOUNT", true);

        vm.startBroadcast(broadcasterKey);
        uint256 tokenId = AuraPost(auraPostAddress).publish(tokenURI, contentHash);
        vm.stopBroadcast();

        console2.log("Published sample post", tokenId, "to AuraPost at", auraPostAddress);

        if (createAccount && registry != address(0) && implementation != address(0)) {
            bytes32 salt = bytes32(tokenId);

            vm.startBroadcast(broadcasterKey);
            address tokenAccount =
                IERC6551Registry(registry).createAccount(implementation, salt, block.chainid, auraPostAddress, tokenId);
            vm.stopBroadcast();

            console2.log("Created ERC-6551 account", tokenAccount, "for token", tokenId);
        } else if (createAccount) {
            console2.log(
                "Skipping ERC-6551 account creation. Provide both AURA_ERC6551_REGISTRY and AURA_ACCOUNT_IMPLEMENTATION."
            );
        } else {
            console2.log("Skipping ERC-6551 account creation (AURA_CREATE_TOKEN_ACCOUNT=false).");
        }
    }
}
