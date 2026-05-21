// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUserReputation {
    function rewardUser(address _user) external;
    function recordNoShow(address _user) external;
}

contract NoShowDeposit {
    struct DepositInfo {
        address consumer;
        address seller;
        uint256 depositAmount;
        uint256 reservationTime;
        uint256 checkInStartTime;
        bool consumerPaid;
        bool sellerConfirmed;
        bool consumerConfirmed;
        bool settled;
        uint256 result;
    }

    address public owner;
    address public reputationContractAddress;

    uint256 public constant CHECKIN_DURATION = 20 minutes;

    mapping(uint256 => DepositInfo) public deposits;

    event DepositCreated(
        uint256 indexed appointmentId,
        address indexed consumer,
        address indexed seller,
        uint256 depositAmount,
        uint256 reservationTime
    );

    event DepositPaid(
        uint256 indexed appointmentId,
        address indexed consumer,
        uint256 depositAmount
    );

    event SellerConfirmed(
        uint256 indexed appointmentId,
        address indexed seller,
        uint256 checkInStartTime
    );

    event ConsumerConfirmed(uint256 indexed appointmentId, address indexed consumer);

    event SettledVisited(
        uint256 indexed appointmentId,
        address indexed consumer,
        uint256 refundAmount
    );

    event SettledNoShow(
        uint256 indexed appointmentId,
        address indexed seller,
        uint256 penaltyAmount
    );

    event RefundedByOwner(
        uint256 indexed appointmentId,
        address indexed consumer,
        uint256 refundAmount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyExistingDeposit(uint256 _appointmentId) {
        require(deposits[_appointmentId].consumer != address(0), "deposit not found");
        _;
    }

    constructor(address _reputationContractAddress) {
        owner = msg.sender;
        reputationContractAddress = _reputationContractAddress;
    }

    function setReputationContract(address _reputationContractAddress) external onlyOwner {
        reputationContractAddress = _reputationContractAddress;
    }

    function createAndPayDeposit(
        uint256 _appointmentId,
        address _seller,
        uint256 _reservationTime
    ) external payable {
        require(_seller != address(0), "invalid seller");
        require(_seller != msg.sender, "same user");
        require(msg.value > 0, "zero amount");
        require(_reservationTime > block.timestamp, "time must be future");
        require(deposits[_appointmentId].consumer == address(0), "already exists");

        deposits[_appointmentId] = DepositInfo({
            consumer: msg.sender,
            seller: _seller,
            depositAmount: msg.value,
            reservationTime: _reservationTime,
            checkInStartTime: 0,
            consumerPaid: true,
            sellerConfirmed: false,
            consumerConfirmed: false,
            settled: false,
            result: 0
        });

        emit DepositCreated(_appointmentId, msg.sender, _seller, msg.value, _reservationTime);
        emit DepositPaid(_appointmentId, msg.sender, msg.value);
    }

    function confirmBySeller(uint256 _appointmentId)
        external
        onlyExistingDeposit(_appointmentId)
    {
        DepositInfo storage depositInfo = deposits[_appointmentId];

        require(msg.sender == depositInfo.seller, "not seller");
        require(depositInfo.consumerPaid, "not paid");
        require(block.timestamp >= depositInfo.reservationTime, "too early");
        require(!depositInfo.sellerConfirmed, "already confirmed");
        require(!depositInfo.settled, "settled");

        depositInfo.sellerConfirmed = true;
        depositInfo.checkInStartTime = block.timestamp;

        emit SellerConfirmed(_appointmentId, msg.sender, block.timestamp);
    }

    function confirmByConsumer(uint256 _appointmentId)
        external
        onlyExistingDeposit(_appointmentId)
    {
        DepositInfo storage depositInfo = deposits[_appointmentId];

        require(msg.sender == depositInfo.consumer, "not consumer");
        require(depositInfo.consumerPaid, "not paid");
        require(depositInfo.sellerConfirmed, "seller not confirmed");
        require(!depositInfo.consumerConfirmed, "already confirmed");
        require(!depositInfo.settled, "settled");
        require(
            block.timestamp <= depositInfo.checkInStartTime + CHECKIN_DURATION,
            "check-in expired"
        );

        depositInfo.consumerConfirmed = true;

        emit ConsumerConfirmed(_appointmentId, msg.sender);
    }

    function settleVisited(uint256 _appointmentId)
        external
        onlyOwner
        onlyExistingDeposit(_appointmentId)
    {
        DepositInfo storage depositInfo = deposits[_appointmentId];

        require(depositInfo.consumerPaid, "not paid");
        require(depositInfo.sellerConfirmed, "seller not confirmed");
        require(depositInfo.consumerConfirmed, "consumer not confirmed");
        require(!depositInfo.settled, "settled");

        depositInfo.settled = true;
        depositInfo.result = 1;

        uint256 amount = depositInfo.depositAmount;
        address consumer = depositInfo.consumer;

        (bool success, ) = payable(consumer).call{value: amount}("");
        require(success, "refund failed");

        _tryRewardUser(consumer);

        emit SettledVisited(_appointmentId, consumer, amount);
    }

    function settleNoShow(uint256 _appointmentId)
        external
        onlyOwner
        onlyExistingDeposit(_appointmentId)
    {
        DepositInfo storage depositInfo = deposits[_appointmentId];

        require(depositInfo.consumerPaid, "not paid");
        require(depositInfo.sellerConfirmed, "seller not confirmed");
        require(!depositInfo.consumerConfirmed, "consumer already confirmed");
        require(!depositInfo.settled, "settled");
        require(
            block.timestamp > depositInfo.checkInStartTime + CHECKIN_DURATION,
            "check-in still open"
        );

        depositInfo.settled = true;
        depositInfo.result = 2;

        uint256 amount = depositInfo.depositAmount;
        address seller = depositInfo.seller;
        address consumer = depositInfo.consumer;

        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "penalty failed");

        _tryRecordNoShow(consumer);

        emit SettledNoShow(_appointmentId, seller, amount);
    }

    function refundByOwner(uint256 _appointmentId)
        external
        onlyOwner
        onlyExistingDeposit(_appointmentId)
    {
        DepositInfo storage depositInfo = deposits[_appointmentId];

        require(depositInfo.consumerPaid, "not paid");
        require(!depositInfo.settled, "settled");

        depositInfo.settled = true;
        depositInfo.result = 3;

        uint256 amount = depositInfo.depositAmount;
        address consumer = depositInfo.consumer;

        (bool success, ) = payable(consumer).call{value: amount}("");
        require(success, "refund failed");

        emit RefundedByOwner(_appointmentId, consumer, amount);
    }

    function canConsumerCheckIn(uint256 _appointmentId) external view returns (bool) {
        DepositInfo memory depositInfo = deposits[_appointmentId];

        return (
            depositInfo.consumerPaid &&
            depositInfo.sellerConfirmed &&
            !depositInfo.consumerConfirmed &&
            !depositInfo.settled &&
            block.timestamp <= depositInfo.checkInStartTime + CHECKIN_DURATION
        );
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _tryRewardUser(address _user) private {
        if (reputationContractAddress == address(0)) {
            return;
        }

        try IUserReputation(reputationContractAddress).rewardUser(_user) {} catch {}
    }

    function _tryRecordNoShow(address _user) private {
        if (reputationContractAddress == address(0)) {
            return;
        }

        try IUserReputation(reputationContractAddress).recordNoShow(_user) {} catch {}
    }

    receive() external payable {
        revert("use deposit function");
    }

    fallback() external payable {
        revert("invalid call");
    }
}
