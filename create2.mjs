var asm = (c) => {
    var bin = {};
    `CALLVALUE 34 CALLDATASIZE 36 CALLDATACOPY 37
     MSTORE 52 JUMPI 57 JUMPDEST 5B
     PUSH1 60 PUSH2 61 PUSH4 63 LOG0 A0
     CREATE2 F5 RETURN F3 SELFDESTRUCT FF`
        .replace(/(\w+)\s*(\w+)\s*/g, (_,k,v) => bin[k] = v); // make bin

    return c.replace(/\/\/.*?\n/g, "")                // remove comments
        .replace(/\s*(\w+)\s*/g, (_,s) => bin[s]||s); // replace with bin
}

// no value => bomb  (0x3DFF)
// has value => cafe (0xCafeBabe)
var bombOrCafe = asm(`
CALLVALUE
PUSH1 0F  // jump to 0x0F if value != 0
JUMPI  

PUSH2 3DFF
PUSH1 00
MSTORE    // mem[1E...1E+02) = 0x3DFF
PUSH1 02
PUSH1 1E
RETURN

JUMPDEST  // PC == 0x0F here
PUSH4 CAFEBABE
PUSH1 00
MSTORE    // mem[1C...1C+04) = 0xCAFEBABE
PUSH1 04
PUSH1 1C
RETURN
`);
console.log("bombOrCafe: " + bombOrCafe);

var calldataAsInitFactory = asm(`
CALLDATASIZE  // CALLDATACOPY arg 2: size
PUSH1 00      // CALLDATACOPY arg 1: call data src offset
PUSH1 00      // CALLDATACOPY arg 0: memory dest offset
CALLDATACOPY  // mem[0...CALLDATASIZE) = call data

PUSH1 00      // CREATE2 arg 3: salt
CALLDATASIZE  // CREATE2 arg 2: init code size
PUSH1 00      // CREATE2 arg 1: memory src offset
CALLVALUE     // CREATE2 arg 0: endowment(value): pass through
CREATE2       // send the init code mem[0 ... init code size)

              // optional: log the result contract addr
              // which is on the top of the stack
PUSH1 00
MSTORE        // mem[0...32) = CREATE2 result addr
PUSH1 14      // LOG0 arg 1: size 0x14 = 20 bytes (160 bits)
PUSH1 0C      // LOG0 arg 0: offset 0x0C = 12 bytes
LOG0          // LOG the result addr
`);


var ethers = await import("ethers");
var provider = new ethers.providers.AlchemyProvider(
    process.env.NETWORK, process.env.ALCHEMY_API_KEY);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var txReceipt = async (t) => (await signer.sendTransaction(t)).wait();

// STEP 0: deploy the factory contract
var deployer = "600B380380600B3D393DF3";
var factoryAddr = (await txReceipt(
    {data: "0x" + deployer + calldataAsInitFactory})).contractAddress;
console.log("factoryAddr: " + factoryAddr);


// STEP 1: value 0 => depoly "bomb"
var addr1 = (await txReceipt(
    {data: "0x" + bombOrCafe, to: factoryAddr, value: 0}
    )).logs[0].data;
var body1 = await provider.getCode(addr1);
console.log("addr1: " + addr1 + " body1: " + body1);


// STEP 2: trigger the bomb
await txReceipt({to: addr1});


// STEP 3: value 1 => re-deploy "cafe"
var addr2 = (await txReceipt(
    {data: "0x" + bombOrCafe, to: factoryAddr, value: 1}
    )).logs[0].data;
var body2 = await provider.getCode(addr2);
console.log("addr2: " + addr2 + " body2: " + body2);


// ASSERT: same address, different code
var assert = await import("node:assert")
assert.ok(body1 != null && body2 != null);
assert.ok(addr1 == addr2 && body1 != body2);

// ASSERT: at the expected CREATE2 address
var initHash = ethers.utils.keccak256("0x" + bombOrCafe).substring(2);
var salt = "0000000000000000000000000000000000000000000000000000000000000000";
var addr = "0x" + ethers.utils.keccak256(
    "0xff"
    + factoryAddr.substring(2)
    + salt
    + initHash
    ).substring(2 + 24);
assert.ok(addr1 == addr);
