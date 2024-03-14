// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import ERC20 interface
import "./Token.sol";

// PoolContract contract definition
contract PoolContract {
    
    // Address of the admin
    address private admin;
    // Address of the ERC20 token
    address private token;
    // Address of the community contract
    address private community;

    // Constructor to initialize the contract with the token address
    constructor(address _token) {
        admin = msg.sender;
        token = _token;
    }

    // Modifier to restrict access to only the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    // Modifier to restrict access to only the community contract
    modifier onlyCommunity() {
        require(msg.sender == community, "Only community can perform this action");
        _;
    }

    // Function to set the address of the community contract
    function setCommunity(address _community) external onlyAdmin {
        community = _community;
    }
    
    // Function to approve tokens to a specific address, callable only by the community contract
    function transferToken(address to, uint256 amount) external onlyCommunity {
        MyToken(token).transfer(to, amount);
    }
}