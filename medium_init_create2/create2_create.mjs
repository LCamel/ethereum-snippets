var { default:solc } = await import('solc');

var src = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract Driver {
    // inspect these address in REMIX
    C0 public c0 = new C0();
    address public addr1;
    address public addr2;
    address public addr3;

    function newC1C2C3() external {
        C1 c1 = c0.newC1(); // CREATE2
        C2 c2 = c1.newC2(); // CREATE
        C3 c3 = c2.newC3(); // CREATE
        addr1 = address(c1);
        addr2 = address(c2);
        addr3 = address(c3);
    }
    function bomb() external {
        (bool ok1, ) = addr1.call(""); // SELFDESTRUCT
        require(ok1);
        (bool ok2, ) = addr2.call(""); // SELFDESTRUCT
        require(ok2);
        (bool ok3, ) = addr3.call(""); // SELFDESTRUCT
        require(ok3);
    }
    function newC1CafeBabe() external {
        C1 c1 = c0.newC1();         // CREATE2: at the same address
        Cafe cafe = c1.newCafe();   // CREATE: replaces C2 at the same address
        Babe babe = cafe.newBabe(); // CREATE: replaces C3 at the same address
        addr1 = address(c1);
        addr2 = address(cafe);
        addr3 = address(babe);
    }
}
contract C0 {
    function newC1() external returns (C1) {
        return new C1{salt: 0}();   // CREATE2 !!
    }
}
contract C1 {
    uint name = 0xC1;
    // branches
    function newC2() external returns (C2) { return new C2(); }
    function newCafe() external returns (Cafe) { return new Cafe(); }
    fallback() external { selfdestruct(payable(address(0))); }
}
contract C2 {
    uint name = 0xC2;
    function newC3() external returns (C3) { return new C3(); }
    fallback() external { selfdestruct(payable(address(0))); }
}
contract C3 {
    uint name = 0xC3;
    fallback() external { selfdestruct(payable(address(0))); }
}
contract Cafe {
    uint name = 0xCafe;
    function newBabe() external returns (Babe) { return new Babe(); }
    fallback() external { selfdestruct(payable(address(0))); }
}
contract Babe {
    uint name = 0xBabe;
    fallback() external { selfdestruct(payable(address(0))); }
}
`;
var driverInit = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: { 'a.sol': { content: src } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
    }))).contracts['a.sol']['Driver'].evm.bytecode.object;

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
    console.log("code length: " + ((await provider.getCode(addr)).length - 2) / 2);
};

console.log("Deploying ...");
var driverAddr = (await txReceipt({data: "0x" + driverInit})).contractAddress;
var driver = new ethers.Contract(driverAddr,
    [ "function newC1C2C3()",
      "function bomb()",
      "function newC1CafeBabe()",
      "function c0() view returns (address)",
      "function addr1() view returns (address)",
      "function addr2() view returns (address)",
      "function addr3() view returns (address)",
    ], signer);
console.log("driverAddr: " + driverAddr);
console.log("c0 addr: " + await driver.c0());

console.log("\nCreating C1 -> C2 -> C3 ...");
await (await driver.newC1C2C3()).wait();
var addr1 = await driver.addr1();
var addr2 = await driver.addr2();
var addr3 = await driver.addr3();
await show(addr1); await show(addr2); await show(addr3);

console.log("\nSELFDESTRUCT-ing ...");
//await (await driver.bomb()).wait();
await (await driver.bomb({gasLimit: 100000})).wait();
await show(addr1); await show(addr2); await show(addr3);

console.log("\nCreating C1 -> Cafe -> Babe ...");
await (await driver.newC1CafeBabe()).wait();
await show(addr1); await show(addr2); await show(addr3);
