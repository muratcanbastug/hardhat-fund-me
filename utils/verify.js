const { run } = require('hardhat');
async function verify(contractAddress, args) {
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.toLowerCase().includes('already verified')) {
      console.log('Already Verified!');
    } else {
      console.log(err);
    }
  }
}
module.exports = { verify };
