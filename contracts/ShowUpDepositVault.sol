// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ShowUpDepositVault {
    address public owner;

    event DepositReceived(address indexed sender, uint256 amount);
    event Withdrawn(address indexed receiver, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");

        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        payable(owner).transfer(balance);

        emit Withdrawn(owner, balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}