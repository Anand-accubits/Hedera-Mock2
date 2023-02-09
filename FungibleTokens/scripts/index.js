const {
    TokenCreateTransaction,
    Client,
    TokenType,
    TokenInfoQuery,
    AccountBalanceQuery, PrivateKey, Wallet, TokenMintTransaction, TokenUpdateTransaction, TokenBurnTransaction
} = require("@hashgraph/sdk");
require('dotenv').config();

const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

if (myAccountId == null ||
    myPrivateKey == null) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}

const otherAccountId = process.env.OTHER_ACCOUNT_ID;
const otherPrivateKey = PrivateKey.fromString(process.env.OTHER_PRIVATE_KEY);

if (otherAccountId == null ||
    otherPrivateKey == null) {
    throw new Error("Environment variables otherAccountId and otherPrivateKey must be present");
}

const otherAccountId2 = process.env.OTHER_ACCOUNT_ID_2;
const otherPrivateKey2 = PrivateKey.fromString(process.env.OTHER_PRIVATE_KEY_2);

if (otherAccountId2 == null ||
    otherPrivateKey2 == null) {
    throw new Error("Environment variables otherAccountId and otherPrivateKey must be present");
}

// Create our connection to the Hedera network
// The Hedera JS SDK makes this really easy!
const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

const adminUser = new Wallet(
    myAccountId,
    myPrivateKey
)

const supplyUser = new Wallet(
    otherAccountId,
    otherPrivateKey
)

const supplyUser2 = new Wallet(
    otherAccountId2,
    otherPrivateKey2
)

async function main() {
    //Create the transaction and freeze for manual signing
    const transaction = await new TokenCreateTransaction()
        .setTokenName("New Hedera Token")
        .setTokenSymbol("NHT")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(myAccountId)
        .setInitialSupply(2000)
        .setAdminKey(adminUser.publicKey)
        .setSupplyKey(supplyUser.publicKey)
        .freezeWith(client);

    //Sign the transaction with the client, who is set as admin and treasury account
    const signTx = await transaction.sign(myPrivateKey);

    //Submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the token ID from the receipt
    const tokenId = receipt.tokenId;

    console.log("The new token ID is " + tokenId);

    //Sign with the client operator private key, submit the query to the network and get the token supply

    const name = await queryTokenFunction("name", tokenId);
    const symbol = await queryTokenFunction("symbol", tokenId);
    const tokenSupply = await queryTokenFunction("totalSupply", tokenId);
    console.log('The total supply of the ' + name + ' token is ' + tokenSupply + ' of ' + symbol);

    //Create the query
    const balanceQuery = new AccountBalanceQuery()
        .setAccountId(adminUser.accountId);

    //Sign with the client operator private key and submit to a Hedera network
    const tokenBalance = await balanceQuery.execute(client);

    console.log("The balance of the user is: " + tokenBalance.tokens.get(tokenId));

    // MINTING 1000 Token
    await mint(tokenId);

    // Update Supply User as OtherAccount2
    await updateSupplyKey(tokenId);

    // Burn 500 Token
    await burn(tokenId);

    process.exit(tokenId);
}

async function mint(tokenId) {
    console.log('MINTING 1000 TOKENS')
    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client2 = Client.forTestnet();
    client2.setOperator(otherAccountId, otherPrivateKey);

    //Burn 42 tokens and freeze the unsigned transaction for manual signing
    const transaction = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(1000)
        .freezeWith(client2);

    //Sign with the supply private key of the token
    const signTx = await transaction.sign(otherPrivateKey);

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client2);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client2);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status " + transactionStatus.toString());


    const name = await queryTokenFunction("name", tokenId);
    const symbol = await queryTokenFunction("symbol", tokenId);
    const tokenSupply = await queryTokenFunction("totalSupply", tokenId);
    console.log('The total supply of the ' + name + ' token is ' + tokenSupply + ' of ' + symbol);

    // process.exit();
}

async function updateSupplyKey(tokenId) {
    console.log('UPDATING SUPPLY USER')
    //Create the transaction and freeze for manual signing
    const transaction = await new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setSupplyKey(supplyUser2.publicKey)
        .freezeWith(client);

    //Sign the transaction with the admin key
    const signTx = await transaction.sign(myPrivateKey);

    //Submit the signed transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status.toString();

    console.log("The transaction consensus status is " + transactionStatus);
    // process.exit();
}


async function burn(tokenId) {
    console.log('BURNING 500 TOKENS')
    // Create our connection to the Hedera network
    // The Hedera JS SDK makes this really easy!
    const client3 = Client.forTestnet();
    client3.setOperator(otherAccountId2, otherPrivateKey2);

    //Burn 42 tokens and freeze the unsigned transaction for manual signing
    const transaction = await new TokenBurnTransaction()
        .setTokenId(tokenId)
        .setAmount(500)
        .freezeWith(client3);

    //Sign with the supply private key of the token
    const signTx = await transaction.sign(otherPrivateKey2);

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client3);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client3);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status " + transactionStatus.toString());

    const name = await queryTokenFunction("name", tokenId);
    const symbol = await queryTokenFunction("symbol", tokenId);
    const tokenSupply = await queryTokenFunction("totalSupply", tokenId);
    console.log('The total supply of the ' + name + ' token is ' + tokenSupply + ' of ' + symbol);

    // process.exit();

    // process.exit();
}

async function queryTokenFunction(functionName, tokenId) {
    //Create the query
    const query = new TokenInfoQuery()
        .setTokenId(tokenId);
    const body = await query.execute(client);

    //Sign with the client operator private key, submit the query to the network and get the token supply
    let result;
    if (functionName === "name") {
        result = body.name;
    } else if (functionName === "symbol") {
        result = body.symbol;
    } else if (functionName === "totalSupply") {
        result = body.totalSupply;
    } else {
        return;
    }

    return result
}

main();
