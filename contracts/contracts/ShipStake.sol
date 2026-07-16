// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ShipStake
/// @notice Stake MON against a self-declared deadline. Get it back if you ship,
///         forfeit it to a shared pool if you don't. Resolution is done by a
///         trusted resolver (backend, checks GitHub PR/issue status) with a
///         permissionless fallback so the app never gets stuck if the resolver
///         goes offline.
contract ShipStake {
    address public immutable resolver;
    address public immutable forfeiturePool;
    uint256 public stakeCount;

    struct Stake {
        address owner;
        uint256 amount;
        uint256 deadline;
        bool resolved;
        bool shipped;
    }

    mapping(uint256 => Stake) public stakes;

    event StakeCreated(uint256 indexed stakeId, address indexed owner, uint256 amount, uint256 deadline);
    event StakeResolved(uint256 indexed stakeId, bool shipped);

    error NotResolver();
    error NoStakeValue();
    error DeadlineInPast();
    error AlreadyResolved();
    error InvalidStake();
    error NotYetExpired();
    error TransferFailed();

    modifier onlyResolver() {
        if (msg.sender != resolver) revert NotResolver();
        _;
    }

    constructor(address _resolver, address _forfeiturePool) {
        resolver = _resolver;
        forfeiturePool = _forfeiturePool;
    }

    function createStake(uint256 deadline) external payable returns (uint256 stakeId) {
        if (msg.value == 0) revert NoStakeValue();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        stakeId = stakeCount++;
        stakes[stakeId] = Stake({
            owner: msg.sender,
            amount: msg.value,
            deadline: deadline,
            resolved: false,
            shipped: false
        });

        emit StakeCreated(stakeId, msg.sender, msg.value, deadline);
    }

    function resolve(uint256 stakeId, bool shipped) external onlyResolver {
        Stake storage s = stakes[stakeId];
        if (s.amount == 0) revert InvalidStake();
        if (s.resolved) revert AlreadyResolved();

        s.resolved = true;
        s.shipped = shipped;

        address recipient = shipped ? s.owner : forfeiturePool;
        (bool ok, ) = payable(recipient).call{value: s.amount}("");
        if (!ok) revert TransferFailed();

        emit StakeResolved(stakeId, shipped);
    }

    function claimExpired(uint256 stakeId) external {
        Stake storage s = stakes[stakeId];
        if (s.amount == 0) revert InvalidStake();
        if (s.resolved) revert AlreadyResolved();
        if (block.timestamp <= s.deadline) revert NotYetExpired();

        s.resolved = true;
        s.shipped = false;

        (bool ok, ) = payable(forfeiturePool).call{value: s.amount}("");
        if (!ok) revert TransferFailed();

        emit StakeResolved(stakeId, false);
    }

    function getStake(uint256 stakeId) external view returns (Stake memory) {
        return stakes[stakeId];
    }
}