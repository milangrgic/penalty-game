// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the ERC20 contract from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// MyToken contract definition inheriting from ERC20
contract MyToken is ERC20 {
    
    // Constructor to initialize the token with a name and symbol
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint initial supply of tokens to the deployer of the contract
        _mint(msg.sender, 1000000 * (10 ** 18)); // Minting 1 million tokens with 18 decimal places
    }
}