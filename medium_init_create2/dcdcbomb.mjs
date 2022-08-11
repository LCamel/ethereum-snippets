var { default:solc } = await import('solc');

var src = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Bomb {
    fallback () external {
        selfdestruct(payable(address(0)));
    }
}
contract DCBomb {
    fallback () external {
        address(new Bomb()).delegatecall("");
    }
}
contract DCDCBomb {
    address public dcbomb = address(new DCBomb());
    fallback () external {
        dcbomb.delegatecall("");
    }
}
`;
var input = {
  language: 'Solidity',
  sources: { 'a.sol': { content: src } },
  settings: { outputSelection: { '*': { '*': ['*'] } } }
};
var output = JSON.parse(solc.compile(JSON.stringify(input)));

var dcdcbomb = output.contracts['a.sol']['DCDCBomb'].evm.bytecode.object;
console.log("dcdcbomb: " + dcdcbomb);


var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var txReceipt = async (t) => (await signer.sendTransaction(t)).wait();

// deploy DCDCBomb
var addr = (await txReceipt({data: "0x" + dcdcbomb})).contractAddress;
console.log("addr: " + addr);

// should be "2" and a non-zero address (dcbomb)
console.log("tx count: " + await provider.getTransactionCount(addr));
console.log("slot 0: " + await provider.getStorageAt(addr, 0));

// trigger the bomb
await txReceipt({to: addr, gasLimit: 100000});

// should be "0" and "0x0000...0000"
console.log("tx count: " + await provider.getTransactionCount(addr));
console.log("slot 0: " + await provider.getStorageAt(addr, 0));
