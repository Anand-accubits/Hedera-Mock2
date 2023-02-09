const {
    TokenCreateTransaction,
    Client,
    TokenType,
    TokenInfoQuery,
    AccountBalanceQuery, PrivateKey, Wallet
} = require("@hashgraph/sdk");
require('dotenv').config();


const create = async (client, adminUser, supplyUser, myAccountId, myPrivateKey) => {
    //Create the transaction and freeze for manual signing
    const transaction = await new TokenCreateTransaction()
        .setTokenName("Hedera Token")
        .setTokenSymbol("HTN")
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

    process.exit();
}

exports.create = () => create(client);