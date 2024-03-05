// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import ERC20 interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import Pool contract
import "./Pool.sol";

// CommunityContract contract definition
contract CommunityContract {

    // Address of the ERC20 token
    address public token;
    // Address of the pool contract
    address public pool;

    // Struct to represent a transfer request
    struct TransferRequest {
        address from;     // Sender of the request
        address to;       // Receiver of the request
        uint256 amount;   // Amount to transfer
        bool approved;    // Flag indicating if the request is approved
        bool completed;   // Flag indicating if the request is completed
    }

    // Address of the admin
    address public admin;
    // Mapping to store whether an address is a member or not
    mapping(address => bool) public isMember;
    // Array to store the list of members
    address[] public members;
    // Array to store transfer requests
    TransferRequest[] public transferRequests;
    // Counter for generating request IDs
    uint256 public nextRequestId;

    // Modifier to restrict access to only the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Events to log member-related actions and transfer requests
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event TransferRequested(uint256 indexed requestId, address indexed from, address indexed to, uint256 amount);
    event TransferApproved(uint256 indexed requestId);
    event TransferCompleted(uint256 indexed requestId);

    // Constructor to initialize the contract with the token and pool addresses
    constructor(address _token, address _pool) {
        admin = msg.sender;
        token = _token;
        pool = _pool;
        isMember[admin] = true;
        members.push(admin);
        isMember[pool] = true;
        members.push(pool);
    }

    // Function to add a new member
    function addMember(address _member) external onlyAdmin {
        require(!isMember[_member], "Member already exists");
        isMember[_member] = true;
        members.push(_member);
        emit MemberAdded(_member);
    }

    // Function to remove a member
    function removeMember(address _member) external onlyAdmin {
        require(isMember[_member], "Member does not exist");
        require(_member != admin && _member != pool, "Can't remove admin or pool");
        isMember[_member] = false;
        emit MemberRemoved(_member);
    }

    // Function to get the list of members
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    // Function to request a transfer
    function requestTransfer(address _to, uint256 _amount) external {
        require(isMember[msg.sender], "Sender is not a member");
        require(isMember[_to], "Recipient is not a member");
        require(IERC20(token).balanceOf(_to) >= _amount, "Insufficient balance");

        transferRequests.push(TransferRequest(msg.sender, _to, _amount, false, false));
        emit TransferRequested(nextRequestId, msg.sender, _to, _amount);
        nextRequestId++;
    }

    // Function to approve a transfer request
    function approveTransfer(uint256 _requestId) external {
        TransferRequest storage request = transferRequests[_requestId];
        require(!request.approved, "Transfer request already approved");
        if (request.to == pool) {
            require(msg.sender == admin, "Only admin can approve transfer");
            PoolContract(pool).approveToken(address(this), request.amount);
        } else {
            require(msg.sender == request.to, "Only requested member can approve transfer");
        }

        request.approved = true;
        emit TransferApproved(_requestId);
    }

    // Function to complete a transfer
    function completeTransfer(uint256 _requestId) external {
        TransferRequest storage request = transferRequests[_requestId];
        require(request.approved, "Transfer request not approved");
        require(!request.completed, "Transfer request already completed");
        require(msg.sender == request.from, "Only requesting member can complete transfer");

        IERC20(token).transferFrom(request.to, msg.sender, request.amount);
        request.completed = true;
        emit TransferCompleted(_requestId);
    }

    // Function to get transfer requests
    function getTransferRequests() external view returns (TransferRequest[] memory) {
        return transferRequests;
    }
}