const { ethers, getNamedAccounts, deployments } = require('hardhat');
const { assert, expect } = require('chai');
const { developmentChains } = require('../../helper-hardhat-config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
      let fundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther('1');
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['all']);
        fundMe = await ethers.getContract('FundMe', deployer);
        mockV3Aggregator = await ethers.getContract(
          'MockV3Aggregator',
          deployer
        );
      });
      describe('constructor', () => {
        it('Set the aggregator address correctly', async () => {
          const response = fundMe.getPriceFeed();
          assert(response, mockV3Aggregator.address);
        });
      });

      describe('fund', () => {
        it('Fails if you send dont enough ETH', async () => {
          await expect(fundMe.fund()).to.be.revertedWithCustomError(
            fundMe,
            'FundMe__LessFund'
          );
        });

        it('Update the amount funded data structure', async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
      });

      describe('withdraw', () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it('Withdraw ETH from a single funder', async () => {
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReciept;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          assert(endingFundMeBalance, 0);
          assert(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it('Allows us to withdraw with multiple funders', async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReciept = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReciept;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          await expect(fundMe.getfunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }

          assert(endingFundMeBalance, 0);
          assert(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it('Only allows the owner to withdraw', async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(
            attackerConnectedContract,
            'FundMe__NotOwner'
          );
        });
      });
    });
