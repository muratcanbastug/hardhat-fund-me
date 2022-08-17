const { getNamedAccounts, ethers } = require('hardhat');

async function main() {
  const deployer = (await getNamedAccounts()).deployer;
  const fundMe = await ethers.getContract('FundMe', deployer);
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);
  console.log('Withdraw!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
