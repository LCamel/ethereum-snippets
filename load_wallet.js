const { ethers } = require("ethers");
const fs = require("fs");

(async () => {

const password = process.env.PASSWORD;
const json = fs.readFileSync(process.stdin.fd);

const wallet = await ethers.Wallet.fromEncryptedJson(json, password);

console.log("address: " + wallet.address);
console.log("publicKey: " + wallet.publicKey);
console.log("privateKey: " + wallet.privateKey);

})();
