// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the ERC20 contract from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Community.sol";

// MyToken contract definition inheriting from ERC20
contract MyToken is ERC20 {
    
    // Address of the admin
    address private admin;
    // Address of the community contract
    address private community;

    // Constructor to initialize the token with a name and symbol
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint initial supply of tokens to the deployer of the contract
        _mint(msg.sender, 1000000 * (10 ** 18)); // Minting 1 million tokens with 18 decimal places
        admin = msg.sender;
    }
    
    // Modifier to restrict access to only the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    // Function to set the address of the community contract
    function setCommunity(address _community) external onlyAdmin {
        community = _community;
    }

    function depositForRequest(address _to, uint256 _value, uint256 _requestId) public returns (bool) {
        address owner = _msgSender();
        _transfer(owner, _to, _value);
        CommunityContract(community).setTokenDepositForRequest(_requestId, _value);
        return true;
    }
}