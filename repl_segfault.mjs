var ethers = await import("ethers");

var provider = ethers.getDefaultProvider();

var balance = await provider.getBalance("0x0000000000000000000000000000000000000000");
console.log("balance: " + balance);

var assert = await import("node:assert"); // move this line to line 2 will solve the issue
