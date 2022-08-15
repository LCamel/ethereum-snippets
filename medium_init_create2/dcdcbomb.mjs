var { default:solc } = await import('solc');

var src = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Bomb {
    fallback() external {
        selfdestruct(payable(address(0)));
    }
}
contract DCBomb {
    fallback() external {
        (bool ok, ) = address(new Bomb()).delegatecall("");
        require(ok);
    }
}
contract DCDCBomb {
    uint private name = 0xDCDCBBBB;
    constructor() payable {}
    fallback() external {
        (bool ok, ) = address(new DCBomb()).delegatecall("");
        require(ok);
    }
}
`;
var dcdcbombInit = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: { 'a.sol': { content: src } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
    }))).contracts['a.sol']['DCDCBomb'].evm.bytecode.object;
console.log("dcdcbombInit length: " + (dcdcbombInit.length / 2));


var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var txReceipt = async (t) => (await signer.sendTransaction(t)).wait();

var show = async (addr) => {
    console.log("addr: " + addr);
    console.log("  nonce: " + await provider.getTransactionCount(addr));
    console.log("  balance: " + await provider.getBalance(addr));
    console.log("  slot 0: " + await provider.getStorageAt(addr, 0));
    console.log("  code length: " + ((await provider.getCode(addr)).length - 2) / 2)
};

console.log("# Deploying DCDCBomb...");
var addr = (await txReceipt({data: "0x" + dcdcbombInit, value: 42})).contractAddress;
await show(addr);

console.log("\n# Trigger it!");
await txReceipt({to: addr});
await show(addr);
