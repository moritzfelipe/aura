// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console2} from "forge-std/Script.sol";
import {ValeuPost} from "../valeu-post/ValeuPost.sol";

interface IERC6551Registry {
    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt,
        bytes calldata initData
    ) external returns (address);
}

/**
 * @title SeedValeuPostsScript
 * @notice Mints a helper post into an existing ValeuPost contract. Useful when seeding
 *         Anvil or Sepolia with demo content for the curator feed.
 *
 * Environment:
 * - PRIVATE_KEY (uint) – broadcaster key.
 * - VALEU_POST_ADDRESS (address) – target ValeuPost contract.
 * - VALEU_IPFS_URI (string) – tokenURI for the new post (ipfs://CID recommended).
 * - VALEU_POST_SAMPLE_HASH (bytes32) – keccak256 hash of the JSON pointed to by the URI.
 * - VALEU_ERC6551_REGISTRY (address, optional) – registry used to create token-bound accounts.
 * - VALEU_ACCOUNT_IMPLEMENTATION (address, optional) – ERC-6551 implementation cloned for each post.
 * - VALEU_CREATE_TOKEN_ACCOUNT (bool, optional) – set to "false" to skip ERC-6551 account creation (default true).
 */
contract SeedValeuPostsScript is Script {
    function run() external {
        uint256 broadcasterKey = vm.envUint("PRIVATE_KEY");
        address valeuPostAddress = vm.envAddress("VALEU_POST_ADDRESS");
        string memory tokenURI = vm.envString("VALEU_IPFS_URI");
        bytes32 contentHash = vm.envBytes32("VALEU_POST_SAMPLE_HASH");
        address registry = vm.envOr("VALEU_ERC6551_REGISTRY", address(0));
        address implementation = vm.envOr("VALEU_ACCOUNT_IMPLEMENTATION", address(0));
        bool createAccount = vm.envOr("VALEU_CREATE_TOKEN_ACCOUNT", true);

        vm.startBroadcast(broadcasterKey);
        uint256 tokenId = ValeuPost(valeuPostAddress).publish(tokenURI, contentHash);
        vm.stopBroadcast();

        console2.log("Published sample post", tokenId, "to the Valeu contract at", valeuPostAddress);

        if (createAccount && registry != address(0) && implementation != address(0)) {
            uint256 salt = tokenId;

            vm.startBroadcast(broadcasterKey);
            try IERC6551Registry(registry).createAccount(
                implementation,
                block.chainid,
                valeuPostAddress,
                tokenId,
                salt,
                new bytes(0)
            ) returns (address tokenAccount) {
                vm.stopBroadcast();
                console2.log("Created ERC-6551 account", tokenAccount, "for token", tokenId);
            } catch (bytes memory revertData) {
                vm.stopBroadcast();
                console2.log(
                    "ERC-6551 account creation reverted. Inspect revert data or registry requirements before retrying."
                );
                console2.logBytes(revertData);
            }
        } else if (createAccount) {
            console2.log(
                "Skipping ERC-6551 account creation. Provide both VALEU_ERC6551_REGISTRY and VALEU_ACCOUNT_IMPLEMENTATION."
            );
        } else {
            console2.log("Skipping ERC-6551 account creation (VALEU_CREATE_TOKEN_ACCOUNT=false).");
        }
    }
}
