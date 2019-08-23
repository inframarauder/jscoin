const sha256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }

  //This hash shall be used to sign our transactions using our private key.
  calculateHash() {
    return sha256(this.from + this.to + this.amount).toString();
  }

  signTransaction(signingKey) {
    //check if from address is the public key of the wallet,else transaction can't be signed
    if (signingKey.getPublic("hex") !== this.from) {
      throw new Error("You are not authorized to sign this transaction!");
    } else {
      let hashTx = this.calculateHash(); //hash the transaction
      let signature = signingKey.sign(hashTx, "base64"); //sign the hash of transaction
      this.signature = signature.toDER("hex");
    }
  }

  isValid() {
    //Mining reward transactions are unsigned, yet valid.
    if (this.from === null) {
      return true;
    }

    //if the transaction has no signature or empty signature, it is invalid:
    if (!this.signature || this.signature.length === 0) {
      throw new Error("Error, unsigned transaction encountered!");
    }

    //Once the above checks are cleared, we verify if the signature is valid :
    const publicKey = ec.keyFromPublic(this.from, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, prevHash) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return sha256(
      this.timestamp +
        JSON.stringify(this.transactions) +
        this.prevHash +
        this.nonce
    ).toString();
  }

  //Force hash to contain certain no. of zeroes. This procedure serves as the PROOF OF WORK.
  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("Block Mined! Hash :", this.hash);
  }

  //verify the transactions inside the block :
  hasValidTransactions() {
    for (let trans of this.transactions) {
      if (!trans.isValid()) {
        console.log(trans + "is invalid"); //logging the invalid transaction for better debugging
        return false;
      }
    }

    return true;
  }
}

class BlockChain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.reward = 100;
  }

  createGenesisBlock() {
    let genesis = new Block(Date.now(), "Genesis Block", "0");
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransaction(rewardAddress) {
    //create the reward transaction and push it to the pending list :
    let rewardTx = new Transaction(null, rewardAddress, this.reward);
    this.pendingTransactions.push(rewardTx);

    //create a new block and mine it :
    let block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    //push the new block to the chain
    console.log("Block Successfully Mined!");
    this.chain.push(block);

    //empty the pending transactions array :
    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    //check if the transaction has a from address and a to address :
    if (!transaction.from || !transaction.to) {
      throw new Error("From address or To address or both are missing!");
    }

    //check if the transaction itself is valid :
    if (!transaction.isValid()) {
      throw new Error("Invalid transaction cannot be added to chain!");
    }

    //if all checks passed,push it to the array :
    this.pendingTransactions.push(transaction);
  }

  getBalance(address) {
    //loop over the entire blockchain to get the balance of a wallet whose address is given :

    let balance = 0;

    for (let block of this.chain) {
      for (let trans of block.transactions) {
        //in case of an outgoing transaction, debit the balance :
        if (trans.from === address) {
          balance -= trans.amount;
        }

        //in case of an incoming transaction, credit the balance :
        if (trans.to === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      let currBlock = this.chain[i];
      let prevBlock = this.chain[i - 1];

      //check if all the transactions in the current block are valid to ensure valid blockchain :
      if (!currBlock.hasValidTransactions()) {
        return false;
      }
      //check if the current block is linked to the previous block via the hash:
      if (currBlock.hash !== currBlock.calculateHash()) {
        return false;
      } else if (currBlock.prevHash !== prevBlock.hash) {
        return false;
      } else {
        return true;
      }
    }
  }
}

module.exports = { BlockChain, Transaction };
