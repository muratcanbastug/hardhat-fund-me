const { ethers, getNamedAccounts, network } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { assert } = require('chai');

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
      let deployer, fundMe;
      const sendValue = ethers.utils.parseEther('1');
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe', deployer);
      });

      it('Allows people to fund and withdraw', async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingContractBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        assert.equal(endingContractBalance.toString(), '0');
      });
    });
