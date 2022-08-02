var asm = (c) => {
    var bin = {};
    `SUB 03 CALLVALUE 34 CALLDATALOAD 35 CALLDATASIZE 36 CALLDATACOPY 37
     CODESIZE 38 CODECOPY 39 RETURNDATASIZE 3D _MYZERO_ 3D
     MSTORE8 53 SSTORE 55 PUSH1 60 DUP1 80 CREATE2 F5 RETURN F3`
        .replace(/(\w+)\s*(\w+)\s*/g, (_,k,v) => bin[k] = v); // make bin

    return c.replace(/\/\/.*?\n/g, "")                // *no comment*
        .replace(/\s*(\w+)\s*/g, (_,s) => bin[s]||s); // replace with bin
}

var initCodeWithValue = asm(`
CALLVALUE
PUSH1 00
MSTORE8   // mem[0] = CALLVALUE % 256
PUSH1 01  // mem length
PUSH1 00  // mem offset
RETURN    // return mem[0 ... 0 + 1)
`);
console.log(initCodeWithValue);

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

var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var tx = await signer.sendTransaction({data: "0x" + initCodeWithValue, value: 0x42});
console.log("tx.hash: " + tx.hash);
var receipt = await tx.wait();
console.log("receipt: " + JSON.stringify(receipt));
var body = await provider.getCode(receipt.contractAddress);
console.log("body: " + body);
