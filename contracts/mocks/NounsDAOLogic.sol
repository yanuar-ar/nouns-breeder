// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.6;

contract NounsDAOLogic {
    struct Receipt {
        /// @notice Whether or not a vote has been cast
        bool hasVoted;
        /// @notice Whether or not the voter supports the proposal or abstains
        uint8 support;
        /// @notice The number of votes the voter had, which were cast
        uint96 votes;
    }

    function getReceipt(uint256 proposalId, address voter) external pure returns (Receipt memory) {
        return Receipt({ hasVoted: true, support: 0, votes: 1 });
    }
}
