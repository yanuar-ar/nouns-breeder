const NounsComposerABI = require('../abi/contracts/composables/composer/NounsComposer.sol/NounsComposer.json');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { Interface } = require('ethers/lib/utils');
const ImageData = require('../files/image-data-v2.json');
const { deflateRawSync } = require('zlib');
const { appendFileSync } = require('fs');

describe('Nouns Breeder Testing', async () => {
  let nounsComposer;
  let nounsComposerProxyAdmin;
  let nounsComposerProxy;
  let SVGRenderer;
  let inflator;
  let NFTDescriptor;
  let nounsArt;
  let nounsComposableDescriptor;
  let nounsSeeder;
  let nounsDAOLogic;
  let nounsEgg;
  let nounsBreeder;
  let owner;
  let nonOwner;

  before(async () => {
    [owner, nonOwner] = await ethers.getSigners();

    const NFTDescriptorContract = await ethers.getContractFactory('NFTDescriptorV2');
    NFTDescriptor = await NFTDescriptorContract.deploy();

    const SVGRendererContract = await ethers.getContractFactory('SVGRenderer');
    SVGRenderer = await SVGRendererContract.deploy();

    const Inflator = await ethers.getContractFactory('Inflator');
    inflator = await Inflator.deploy();

    const NounsArt = await ethers.getContractFactory('NounsArt');
    nounsArt = await NounsArt.deploy(owner.address, inflator.address);

    const NounsSeeder = await ethers.getContractFactory('NounsSeeder');
    nounsSeeder = await NounsSeeder.deploy();

    const NounsDAOLogic = await ethers.getContractFactory('NounsDAOLogic');
    nounsDAOLogic = await NounsDAOLogic.deploy();

    const NounsEgg = await ethers.getContractFactory('NounsEgg');
    nounsEgg = await NounsEgg.deploy(nounsDAOLogic.address, 1, 'x');

    const NounsBreeder = await ethers.getContractFactory('NounsBreeder');
    nounsBreeder = await NounsBreeder.deploy(nounsEgg.address, owner.address, nounsSeeder.address);

    const NounsComposer = await ethers.getContractFactory('NounsComposer');
    nounsComposer = await NounsComposer.deploy();

    const NounsComposerProxyAdmin = await ethers.getContractFactory('NounsComposerProxyAdmin');
    nounsComposerProxyAdmin = await NounsComposerProxyAdmin.deploy();

    const NounsComposerProxy = await ethers.getContractFactory('NounsComposerProxy');
    nounsComposerProxy = await NounsComposerProxy.deploy(
      nounsComposer.address,
      nounsComposerProxyAdmin.address,
      new Interface(NounsComposerABI).encodeFunctionData('initialize', [nounsBreeder.address]),
    );

    const NounsComposableDescriptor = await ethers.getContractFactory('NounsComposableDescriptor', {
      libraries: {
        NFTDescriptorV2: NFTDescriptor.address,
      },
    });
    nounsComposableDescriptor = await NounsComposableDescriptor.deploy(
      nounsArt.address,
      SVGRenderer.address,
      nounsComposerProxy.address,
    );

    await nounsArt.setDescriptor(nounsComposableDescriptor.address);
    await nounsBreeder.setDescriptor(nounsComposableDescriptor.address);
  });

  describe('Deployment', async () => {
    it('should deployed', async function () {
      expect(nounsComposer.address).to.not.equal('');
      expect(nounsComposerProxyAdmin.address).to.not.equal('');
      expect(nounsComposerProxy.address).to.not.equal('');
      expect(SVGRenderer.address).to.not.equal('');
      expect(inflator.address).to.not.equal('');
      expect(NFTDescriptor.address).to.not.equal('');
      expect(nounsArt.address).to.not.equal('');
      expect(nounsComposableDescriptor.address).to.not.equal('');
      expect(nounsSeeder.address).to.not.equal('');
      expect(nounsBreeder.address).to.not.equal('');
      expect(nounsEgg.address).to.not.equal('');
      expect(await nounsArt.descriptor()).to.eq(nounsComposableDescriptor.address);
      expect(await nounsBreeder.descriptor()).to.eq(nounsComposableDescriptor.address);
      expect(await nounsBreeder.seeder()).to.eq(nounsSeeder.address);
    });
    it('should populate descriptor', async function () {
      function dataToDescriptorInput(data) {
        const abiEncoded = ethers.utils.defaultAbiCoder.encode(['bytes[]'], [data]);
        const encodedCompressed = `0x${deflateRawSync(
          Buffer.from(abiEncoded.substring(2), 'hex'),
        ).toString('hex')}`;

        const originalLength = abiEncoded.substring(2).length / 2;
        const itemCount = data.length;

        return {
          encodedCompressed,
          originalLength,
          itemCount,
        };
      }

      const { bgcolors, palette, images } = ImageData;
      const { bodies, accessories, heads, glasses } = images;

      const bodiesPage = dataToDescriptorInput(bodies.map(({ data }) => data));
      const headsPage = dataToDescriptorInput(heads.map(({ data }) => data));
      const glassesPage = dataToDescriptorInput(glasses.map(({ data }) => data));
      const accessoriesPage = dataToDescriptorInput(accessories.map(({ data }) => data));

      await nounsComposableDescriptor.addManyBackgrounds(bgcolors);
      await nounsComposableDescriptor.setPalette(0, `0x000000${palette.join('')}`);

      await nounsComposableDescriptor.addBodies(
        bodiesPage.encodedCompressed,
        bodiesPage.originalLength,
        bodiesPage.itemCount,
      );
      await nounsComposableDescriptor.addHeads(
        headsPage.encodedCompressed,
        headsPage.originalLength,
        headsPage.itemCount,
      );
      await nounsComposableDescriptor.addGlasses(
        glassesPage.encodedCompressed,
        glassesPage.originalLength,
        glassesPage.itemCount,
      );
      await nounsComposableDescriptor.addAccessories(
        accessoriesPage.encodedCompressed,
        accessoriesPage.originalLength,
        accessoriesPage.itemCount,
      );

      expect(await nounsComposableDescriptor.backgroundCount()).to.eq(ethers.BigNumber.from('2'));
      expect(await nounsComposableDescriptor.bodyCount()).to.eq(
        ethers.BigNumber.from(bodies.length),
      );
      expect(await nounsComposableDescriptor.accessoryCount()).to.eq(
        ethers.BigNumber.from(accessories.length),
      );
      expect(await nounsComposableDescriptor.headCount()).to.eq(
        ethers.BigNumber.from(heads.length),
      );
      expect(await nounsComposableDescriptor.glassesCount()).to.eq(
        ethers.BigNumber.from(glasses.length),
      );
    });
  });

  describe('Testing Nouns Egg', async () => {
    it('should set contract URI', async () => {
      await nounsEgg.setBaseURI('ipfs://qm6yUiaiak');

      expect(await nounsEgg.baseTokenURI()).to.eq('ipfs://qm6yUiaiak');
    });

    it('should set reward rate', async () => {
      await nounsEgg.setRewardRate(ethers.BigNumber.from('2'));

      expect(await nounsEgg.rewardRate()).to.eq(ethers.BigNumber.from('2'));

      await nounsEgg.setRewardRate(ethers.BigNumber.from('1'));
      expect(await nounsEgg.rewardRate()).to.eq(ethers.BigNumber.from('1'));
    });

    it('should claim Egg correctly', async () => {
      await nounsEgg.claimEgg(1);
      expect(await nounsEgg.balanceOf(owner.address, 1)).to.eq(ethers.BigNumber.from('1'));

      // increase reward rate
      await nounsEgg.setRewardRate(ethers.BigNumber.from('2'));
      await nounsEgg.claimEgg(2);
      expect(await nounsEgg.balanceOf(owner.address, 1)).to.eq(ethers.BigNumber.from('3'));
    });

    it('should claim Egg reverted by Proposal already claimed', async () => {
      await nounsEgg.setRewardRate(ethers.BigNumber.from('1'));
      await nounsEgg.claimEgg(3);
      await expect(nounsEgg.claimEgg(3)).to.be.revertedWith('Proposal already claimed');
    });
  });

  describe('Testing Nouns Breeder', async () => {
    it('should breed', async () => {
      // balance = 4
      await nounsEgg.setApprovalForAll(nounsBreeder.address, true);

      await nounsBreeder.breed();

      expect(await nounsEgg.balanceOf(owner.address, 1)).to.eq(ethers.BigNumber.from('3'));
      expect(await nounsBreeder.balanceOf(owner.address)).to.eq(ethers.BigNumber.from('1'));

      await nounsBreeder.breed();
      expect(await nounsEgg.balanceOf(owner.address, 1)).to.eq(ethers.BigNumber.from('2'));
      expect(await nounsBreeder.balanceOf(owner.address)).to.eq(ethers.BigNumber.from('2'));
    });

    it('should generate valid tokenURI', async () => {
      const tokenUri = await nounsBreeder.tokenURI(0, { gasLimit: 500000000 });

      const { name, description, image } = JSON.parse(
        Buffer.from(tokenUri.replace('data:application/json;base64,', ''), 'base64').toString(
          'ascii',
        ),
      );

      expect(name).to.equal(`Nouns Breeder 0`);
      expect(description).to.equal(`Nouns Breeder 0 is a collectible in Nouns ecosystem.`);
      expect(image).to.not.be.undefined;

      appendFileSync(
        'images.svg',
        Buffer.from(image.split(';base64,').pop(), 'base64').toString('ascii'),
      );
    }).timeout(100000);
  });
});
