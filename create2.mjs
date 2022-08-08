var asm = (c) => {
    var bin = {};
    `SUB 03 CALLVALUE 34 CODESIZE 38 CODECOPY 39
     RETURNDATASIZE 3D _MYZERO_ 3D
     MSTORE8 53 PUSH1 60 DUP1 80 CREATE2 F5 RETURN F3`
        .replace(/(\w+)\s*(\w+)\s*/g, (_,k,v) => bin[k] = v); // make bin

    return c.replace(/\/\/.*?\n/g, "")                // *no comment*
        .replace(/\s*(\w+)\s*/g, (_,s) => bin[s]||s); // replace with bin
}

var init42 = asm(`
PUSH1 42  // 1: value
PUSH1 00  // 0: mem dest offset
MSTORE8   // mem[0] = 0x42
PUSH1 01  // 1: mem length
PUSH1 00  // 0: mem offset
RETURN    // return mem[offset ... offset + length)
`);
console.log("init42: " + init42);

var initCafeBabe = asm(`
PUSH1 04  // 2: length of body
PUSH1 0C  // 1: code src offset (skip deployer size)
PUSH1 00  // 0: mem dest offset
CODECOPY  // now mem[0..4) = 0xCAFEBABE
PUSH1 04  // 1: length of body
PUSH1 00  // 0: mem offset
RETURN    // return mem[offset ... offset + length)
CAFEBABE  // body being appended here
`)
console.log("initCafeBabe: " + initCafeBabe);

// append any body after this fixed, 0x0B-byte deployer
var deployer = asm(`
PUSH1 0B  // deployer size (fixed)
CODESIZE  // deployer + body
SUB       // 1: length of body
DUP1         // 2: length of body
PUSH1 0B     // 1: code src offset
_MYZERO_     // 0: memory dest offset
CODECOPY
_MYZERO_  // 0: memory src offset
RETURN
`);
console.log("deployer: " + deployer); 


var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var deploy = async (initCode) => {
    console.log("==== deploy: initCode: " + initCode);
    var tx = await signer.sendTransaction({data: "0x" + initCode});
    console.log("tx.hash: " + tx.hash);
    var receipt = await tx.wait();
    console.log("receipt: " + JSON.stringify(receipt));
    var body = await provider.getCode(receipt.contractAddress);
    console.log("body: " + body);
    return [tx, receipt, body];
}

await deploy(init42);
await deploy(initCafeBabe);
await deploy(deployer + "CAFEBABE");
