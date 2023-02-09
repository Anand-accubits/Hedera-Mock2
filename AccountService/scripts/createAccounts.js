const { PrivateKey, AccountCreateTransaction, Hbar, Client, AccountBalanceQuery } = require('@hashgraph/sdk');
require('dotenv').config()

// Grab account id and private key from ENV
const myAccountId = process.env.MY_ACCOUNT_ID
const myPrivateKey = process.env.MY_PRIVATE_KEY

// If weren't able to grab it, should throw a new error
if (myAccountId == null ||
    myPrivateKey == null ) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}

// Connect with Hedera
const client = Client.forTestnet();
client.setOperator(myAccountId, myPrivateKey)

/**
 * 
 * @param {number} counts 
 * @returns 
 */
async function createAccountKeys(counts) {
    const accounts = []
    for (let i = 0; i < counts; i++) {
        const newPrivateKey = PrivateKey.generateED25519();
        const newPublicKey = newPrivateKey.publicKey;

        accounts.push({
            privateKey: newPrivateKey,
            publicKey: newPublicKey
        })
    }

    return accounts;
}

/**
 * Function to create 5 accounts and transfer 
 */
async function createAccounts() {
    const accounts = await createAccountKeys(5);
    for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        const createAccountTx = await new AccountCreateTransaction()
            .setKey(account.publicKey)
            .setInitialBalance(new Hbar(100))
            .execute(client);

        const receipt = await createAccountTx.getReceipt(client);

        console.log(`PrivateKey: ${account.privateKey}, PublicKey: ${account.publicKey}, AccountId: ${receipt.accountId}`)
    }
    process.exit();
}

createAccounts();