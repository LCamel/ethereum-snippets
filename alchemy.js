var { ethers } = require("ethers");
//var fs = require("fs");

(async () => {

var provider = new ethers.providers.AlchemyProvider(process.env.NETWORK, process.env.ALCHEMY_API_KEY);

//var signer = await ethers.Wallet.fromEncryptedJson(
//        fs.readFileSync(process.env.WALLET_PATH), process.env.WALLET_PASSWORD); 
//signer = signer.connect(provider);
var signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

var tx = await signer.sendTransaction({to:null, data:"0x3460cd55", value:0xab});

console.log("tx.hash: " + tx.hash);

var receipt = await tx.wait();

console.log("receipt.contractAddress: " + receipt.contractAddress);

})();
