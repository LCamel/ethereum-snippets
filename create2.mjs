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
PUSH1 42
PUSH1 00  // mem offset
MSTORE8   // mem[0] = 0x42
PUSH1 01  // mem length
PUSH1 00  // mem offset
RETURN    // return mem[offset ... offset + length)
`);
console.log("init42: " + init42);

var initCafeBabe = asm(`
PUSH1 04  // 2: length of body
PUSH1 0C  // 1: code src offset (skip deployer size)
PUSH1 00  // 0: memory dest offset
CODECOPY  // now mem[0..4) = 0xCAFEBABE
PUSH1 04  // 1: length of body
PUSH1 00  // 0: mem offset
RETURN    // return mem[offset ... offset + length)
CAFEBABE  // body being appended here
`)
console.log("initCafeBabe: " + initCafeBabe);

// Prepend this 12-byte code before the body
var deployer = asm(`
PUSH1 0B  // [... RETURN] fixed deployer size
CODESIZE
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

throw "";

var initCodeWithValue = asm(`
CALLVALUE // push CALLVALUE on the stack
PUSH1 00  // mem offset
MSTORE8   // mem[0] = CALLVALUE % 256
PUSH1 01  // mem length
PUSH1 00  // mem offset
RETURN    // return mem[0 ... 0 + 1)
`);
console.log(initCodeWithValue); // 3460005360016000F3

var factory = asm(`
PUSH9 ${initCodeWithValue} // target init code (9 bytes)
PUSH1 00   // mem offset
MSTORE     // mem[32 - 9 ...] = 0x34600053...
           // leading zero offset = 32 - 9 = 23 = 0x17

PUSH1 00   // 3: salt
PUSH1 09   // 2: init codesize
PUSH1 17   // 1: memory src offset 0x17
CALLVALUE  // 0: pass value as the init code value
CREATE2
`);


/*
var tx = await signer.sendTransaction({data: "0x" + initCodeWithValue, value: 0x42});
console.log("tx.hash: " + tx.hash);
var receipt = await tx.wait();
console.log("receipt: " + JSON.stringify(receipt));
var body = await provider.getCode(receipt.contractAddress);
console.log("body: " + body);
*/
var tx = await signer.sendTransaction({data: "0x" + initWithPayload + factory});
console.log("tx.hash: " + tx.hash);
var receipt = await tx.wait();
console.log("receipt: " + JSON.stringify(receipt));
var body = await provider.getCode(receipt.contractAddress);
console.log("body: " + body);

var targetAddress = ethers.utils.keccak256(
    "0x" + "ff" + receipt.contractAddress.substring(2)
    + "0000000000000000000000000000000000000000000000000000000000000000"
    + ethers.utils.keccak256("0x" + initCodeWithValue).substring(2)
    ).substring(2 + 12 * 2);
console.log("targetAddress: " + targetAddress);

// 256 / 8 = 32 bytes
// 160 / 8 = 20 bytes
// 96 / 8 = 12kkk

/*
var code = asm(`
PUSH1 0B  // [... RETURN] size
CODESIZE
SUB       // 1: length of payload
DUP1         // 2: length of payload
PUSH1 0B     // 1: code src offset
_MYZERO_     // 0: memory dest offset
CODECOPY
_MYZERO_  // 0: memory src offset
RETURN
 
CALLDATASIZE // 2: size
PUSH1 00     // 1: call data src offset
PUSH1 00     // 0: memory dest offset
CALLDATACOPY
PUSH1 00     // 3: salt
CALLDATASIZE // 2: size
PUSH1 00     // 1: memory src offset
PUSH1 00     // 0: endowment
CREATE2
`);
console.log("code: " + code);
*/
