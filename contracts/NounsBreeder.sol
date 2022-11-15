// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import { IERC1155 } from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import { INounsDescriptorMinimal } from './interfaces/INounsDescriptorMinimal.sol';
import { INounsSeeder } from './interfaces/INounsSeeder.sol';

contract NounsBreeder is ERC721, ERC721Enumerable, Ownable, ERC1155Holder {
    // The Nouns token URI descriptor
    INounsDescriptorMinimal public descriptor;

    // The Nouns token seeder
    INounsSeeder public seeder;

    IERC1155 public nounsEgg;

    mapping(uint256 => INounsSeeder.Seed) public seeds;

    uint256 private _currentTokenId;

    constructor(
        IERC1155 _nounsEgg,
        INounsDescriptorMinimal _descriptor,
        INounsSeeder _seeder
    ) ERC721('Nouns Breeder', 'BREEDER') {
        nounsEgg = _nounsEgg;
        descriptor = _descriptor;
        seeder = _seeder;
    }

    function breed() public {
        require(nounsEgg.balanceOf(msg.sender, 1) > 0, 'Not enough EGG');
        nounsEgg.safeTransferFrom(msg.sender, address(this), 1, 1, '');
        _mintTo(msg.sender, _currentTokenId++);
    }

    function breedTest() public {
        _mintTo(msg.sender, _currentTokenId++);
    }

    function _mintTo(address to, uint256 tokenId) internal returns (uint256) {
        INounsSeeder.Seed memory seed = seeds[tokenId] = seeder.generateSeed(tokenId, descriptor);

        _mint(to, tokenId);

        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return descriptor.tokenURI(tokenId, seeds[tokenId]);
    }

    function dataURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), 'NounsToken: URI query for nonexistent token');
        return descriptor.dataURI(tokenId, seeds[tokenId]);
    }

    function setDescriptor(INounsDescriptorMinimal _descriptor) external onlyOwner {
        descriptor = _descriptor;
    }

    function setSeeder(INounsSeeder _seeder) external onlyOwner {
        seeder = _seeder;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
