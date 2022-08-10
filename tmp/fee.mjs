// Cannot use import statement inside the Node.js REPL, alternatively use dynamic import
// .load fee.mjs
var ethers = await import("ethers");
var assert = await import("node:assert");

var provider = new ethers.providers.AlchemyProvider(process.env.NETWORK, process.env.ALCHEMY_API_KEY);

var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var addr0 = signer.address;
var addr1 = process.env.ADDR_1;
console.log("addr0: " + addr0);
console.log("addr1: " + addr1);

var balance0_0 = await provider.getBalance(addr0);
var balance1_0 = await provider.getBalance(addr1);
console.log("balance0_0: " + balance0_0);
console.log("balance1_0: " + balance1_0);

var transferValue = 42;
var tx = await signer.sendTransaction({from:addr0, to:addr1, value:transferValue});
console.log("tx.hash: " + tx.hash);
var receipt = await tx.wait(); // several seconds
console.log("receipt: " + JSON.stringify(receipt));

var balance0_1 = await provider.getBalance(addr0);
var balance1_1 = await provider.getBalance(addr1);
console.log("balance0_1: " + balance0_1);
console.log("balance1_1: " + balance1_1);

var diff0 = balance0_1.sub(balance0_0);
var diff1 = balance1_1.sub(balance1_0);
console.log("diff0: " + diff0);
console.log("diff1: " + diff1);

assert.ok(diff1.eq(transferValue));
assert.ok(diff0.mul(-1).eq(receipt.gasUsed.mul(receipt.effectiveGasPrice).add(transferValue)))
assert.ok(receipt.gasUsed.eq(21000));
