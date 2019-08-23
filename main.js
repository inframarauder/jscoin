const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { BlockChain, Transaction } = require("./blockchain");
const { privateKey } = require("./keygenerator");

const myKey = ec.keyFromPrivate(privateKey);
const myWalletAddress = myKey.getPublic("hex"); //public key/address of the wallet

let jscoin = new BlockChain(); //Create a new jscoin Blockchain instance

//make a transaction :
const tx1 = new Transaction(myWalletAddress, "random public key", 10);
tx1.signTransaction(myKey); //sign the transaction

jscoin.addTransaction(tx1); //add the transaction to the blockchain

console.log("Starting the miner....");
jscoin.minePendingTransaction(myWalletAddress); //first block mined

console.log("Balance of my wallet is :", jscoin.getBalance(myWalletAddress));

//tamper with a block :
jscoin.chain[1].transactions[0].amount = 1;
console.log("After tampering, is chain valid?", jscoin.isChainValid());
