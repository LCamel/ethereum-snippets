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
        address(new Bomb()).delegatecall("");
    }
}
contract DCDCBomb {
    address public dcbomb = address(new DCBomb());
    constructor() payable {}
    fallback() external {
        dcbomb.delegatecall("");
    }
}
`;
var dcdcbomb = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: { 'a.sol': { content: src } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
    }))).contracts['a.sol']['DCDCBomb'].evm.bytecode.object;
console.log("dcdcbomb: " + dcdcbomb);


var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var txReceipt = async (t) => (await signer.sendTransaction(t)).wait();

var show = async (addr) => {
    console.log("======== addr: " + addr);
    console.log("nonce: " + await provider.getTransactionCount(addr));
    console.log("balance: " + await provider.getBalance(addr));
    console.log("slot 0: " + await provider.getStorageAt(addr, 0));
    console.log("code: " + await provider.getCode(addr));
};

console.log("Deploying DCDCBomb...");
var addr = (await txReceipt({data: "0x" + dcdcbomb, value: 42})).contractAddress;

console.log("Trigger it!");
show(addr);
await txReceipt({to: addr, gasLimit: 100000});
show(addr);
