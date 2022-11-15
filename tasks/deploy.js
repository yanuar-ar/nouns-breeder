const { task, types } = require('hardhat/config');

task('deploy', 'Deploy contract')
  .addOptionalParam('nounsdaologic', 'NounsDAOLogic address', '0x', types.string)
  .addOptionalParam('rewardrate', 'Reward rate', '0x', types.int)
  .addOptionalParam('basetokenuri', 'Base token URI', '', types.string)
  .addOptionalParam('descriptor', 'NounsComposableDescriptor address', '0x', types.string)
  .addOptionalParam('seeder', 'NounsSeeder address', '0x', types.string)
  .setAction(
    async (
      { nounsdaologic, rewardrate, basetokenuri, descriptor, seeder },
      { ethers, upgrades },
    ) => {
      const NounsEgg = await ethers.getContractFactory('NounsEgg');
      const nounsEgg = await NounsEgg.deploy(nounsdaologic, rewardrate, basetokenuri);
      await nounsEgg.deployed();
      console.log('NounsEgg deployed to: ', nounsEgg.address);

      const NounsBreeder = await ethers.getContractFactory('NounsBreeder');
      const nounsBreeder = await NounsBreeder.deploy(nounsEgg.address, descriptor, seeder);
      await nounsBreeder.deployed();
      console.log('NounsBreeder deployed to: ', nounsBreeder.address);
    },
  );
