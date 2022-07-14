// Cannot use import statement inside the Node.js REPL, alternatively use dynamic import
var ethers = await import("ethers");
var assert = await import("node:assert");

//var provider = new ethers.providers.IpcProvider(process.env.IPC_PATH);
var provider = new ethers.providers.AlchemyProvider(process.env.NETWORK, process.env.ALCHEMY_API_KEY);

var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var addr0 = signer.address;
console.log("addr0: " + addr0);

var asm = (code) => {
    var bin = {};
    "STOP 00 PUSH1 60 PUSH2 61 RETURN F3"
        .replace(/(\w+)\s*(\w+)\s*/g, (_,k,v) => bin[k] = v);
    return "0x" + code.replace(/(\w+)\s*/g, (_,s) => bin[s]||s);
};

var codes = [
    "",                         // 53000 = 21000 + 32000
    "PUSH1 01 PUSH1 00 RETURN", // 53277 = 21000 + 32000 + 16*4+4 + 3*2+0 + 3*1 + 200*1
    "PUSH1 02 PUSH1 00 RETURN", // 53477 = 21000 + 32000 + 16*4+4 + 3*2+0 + 3*1 + 200*2
];

var tx;
var recipt;
for (const code of codes) {
    console.log("==== code: " + code + " asm(code): " + asm(code));

    var balance0_0 = await provider.getBalance(addr0);

    tx = await signer.sendTransaction({from:signer.address, to:undefined, data:asm(code)});
    console.log("tx.hash: " + tx.hash);

    receipt = await tx.wait(); // several seconds
    console.log("receipt: " + JSON.stringify(receipt));
    console.log("gas: " + receipt.gasUsed.toNumber());

    var balance0_1 = await provider.getBalance(addr0);

    var diff0 = balance0_1.sub(balance0_0);
    console.log("diff0: " + diff0);
}



//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x00"}); // 53004
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x0000"}); // 53008
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x0001"}); // 53020
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x6000"}); // 53023
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x6001"}); // 53035
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60016000"}); // 53058 0x
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60006000f3"}); // 53062 0x
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60016000f3"}); // 53277 0x00
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60026000f3"}); // 53477 0x0000
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60036000f3"}); // 53677 0x000000
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x601e6000f3"}); // 59077
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x601f6000f3"}); // 59277
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60206000f3"}); // 59477
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x60216000f3"}); // 59680
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x600061200053"}); // 
//var tx = await signer.sendTransaction({from:addr0, to:undefined, data:"0x600061013f53"}); // 59680

/*
assert.ok(diff1.eq(transferValue));
assert.ok(diff0.mul(-1).eq(receipt.gasUsed.mul(receipt.effectiveGasPrice).add(transferValue)))
assert.ok(receipt.gasUsed.eq(21000));
*/
