const {
  networkConfig,
  developmentChains,
} = require('../helper-hardhat-config.js');
const { network } = require('hardhat');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let ETHUSDPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get('MockV3Aggregator');
    ETHUSDPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ETHUSDPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  }
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: [ETHUSDPriceFeedAddress],
    log: true,
    withConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ETHUSDPriceFeedAddress]);
  }
  log('----------------------------------------------------------');
};
module.exports.tags = ['all', 'fundme'];
