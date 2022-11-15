// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import './interfaces/INounsDAOLogic.sol';

contract NounsEgg is ERC1155, Ownable, ERC1155Supply {
    mapping(uint256 => mapping(address => uint256)) public claimedProposal;

    // reward rate in WEI
    uint256 public rewardRate;

    // NousDAOLogicV1
    INounsDAOLogic public NounsDAOLogic;

    string public baseTokenURI;

    constructor(
        INounsDAOLogic _NounsDAOLogic,
        uint256 _rewardRate,
        string memory _baseTokenURI
    ) ERC1155('') {
        NounsDAOLogic = _NounsDAOLogic;
        rewardRate = _rewardRate;
        baseTokenURI = _baseTokenURI;
    }

    function claimEgg(uint256 proposalId) public {
        require(claimedProposal[proposalId][msg.sender] == 0, 'Proposal already claimed');

        uint96 votes = NounsDAOLogic.getReceipt(proposalId, msg.sender).votes;
        require(votes > 0, 'No Votes');

        uint256 eggAmount = rewardRate * votes;

        claimedProposal[proposalId][msg.sender] = votes;

        _mint(msg.sender, 1, eggAmount, '');
    }

    function claimEggTest() public {
        _mint(msg.sender, 1, 1, '');
    }

    // token URI
    function setBaseURI(string calldata _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(exists(tokenId), 'Token does not exists !');
        return bytes(baseTokenURI).length > 0 ? string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))) : '';
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
