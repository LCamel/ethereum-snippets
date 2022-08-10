// We may #define our own mnemonic in the assembler.
// For example, we often want to push a 0 to the top of the stack.
// Instead of PUSH1 00, we can replace it with RETURNDATASIZE (0x3D)
// to squeeze out some gas (only before CALL-ing any other contract).
// By defining "_MYZERO_ 3D", we can make our intention clear.
var asm = (c) => {
    var bin = {};
    `SUB 03 CODESIZE 38 CODECOPY 39   _MYZERO_ 3D
     MSTORE8 53 PUSH1 60 DUP1 80 RETURN F3`
        .replace(/(\w+)\s*(\w+)\s*/g, (_,k,v) => bin[k] = v); // make bin

    return c.replace(/\/\/.*?\n/g, "")                // remove comments
        .replace(/\s*(\w+)\s*/g, (_,s) => bin[s]||s); // replace with bin
}

var init42 = asm(`
PUSH1 42  // MSTORE8 arg 1: value
PUSH1 00  // MSTORE8 arg 0: mem dest offset
MSTORE8   // mem[0] = 0x42
PUSH1 01  // RETURN  arg 1: body size
PUSH1 00  // RETURN  arg 0: mem offset
RETURN    // return mem[offset ... offset + body size)
`);
console.log("init42: " + init42);

var initCafeBabe = asm(`
PUSH1 04  // CODECOPY arg 2: body size
PUSH1 0C  // CODECOPY arg 1: code src offset (skip deployer size)
PUSH1 00  // CODECOPY arg 0: mem dest offset
CODECOPY  // mem[0..4) = 0xCAFEBABE
PUSH1 04  // RETURN   arg 1: body size
PUSH1 00  // RETURN   arg 0: mem offset
RETURN    // return mem[offset ... offset + body size)

CAFEBABE  // 4-byte body being appended here
`)
console.log("initCafeBabe: " + initCafeBabe);

// append any body after this 0x0B-byte deployer
var deployer = asm(`
PUSH1 0B  // deployer size (fixed)
CODESIZE  // code size == deployer size + body size
SUB       // RETURN arg 1: body size
DUP1         // CODECOPY arg 2: body size
PUSH1 0B     // CODECOPY arg 1: code src offset
_MYZERO_     // CODECOPY arg 0: memory dest offset 0
CODECOPY     // mem[0 ... body size) = body
_MYZERO_  // RETURN arg 0: memory offset 0
RETURN    // return mem[0 ... body size)
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
