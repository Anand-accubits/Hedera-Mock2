

const {
    Client, Wallet, LocalProvider, PrivateKey, CustomRoyaltyFee, AccountBalanceQuery, CustomFixedFee, Hbar, TokenAssociateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction, TransferTransaction
} = require("@hashgraph/sdk");

require('dotenv').config();

// import MirrorChannel from '@hashgraph/sdk/lib/channel/MirrorChannel.js';

console.log(process.env.OTHER_ACCOUNT_ID)

//Grab your Hedera testnet account ID and private key from your .env file
const otherAccountId = process.env.OTHER_ACCOUNT_ID;
const otherPrivateKey = PrivateKey.fromString(process.env.OTHER_PRIVATE_KEY);

const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

if (myAccountId == null ||
    myPrivateKey == null) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}



const client = Client.forTestnet();
client.setOperator(myAccountId, myPrivateKey);


async function main() {
    // CREATE NFT
    const tokenId = await createNft(client, myAccountId, myPrivateKey, otherAccountId)
    console.log("TOKENID: ", tokenId.toString())
    // MINT NFT
    await mintNft(tokenId);

    // ASSOCIATE TOKEN
    await associateToken(tokenId)

    // TRANSFER NFT
    await transfer(tokenId);

    process.exit()
}

async function createNft(client, account1, myPrivateKey) {
    // DEFINE CUSTOM FEE SCHEDULE (10% royalty fee)  
    let nftCustomFee = new CustomRoyaltyFee()
        .setNumerator(10)
        .setDenominator(100)
        .setFeeCollectorAccountId(account1)
        //the fallback fee is set to 1000 hbar.
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1000)));

    let nftCreate = await new TokenCreateTransaction()
        .setTokenName("New Hedera NFT")
        .setTokenSymbol("NHNFT")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(myAccountId)
        .setSupplyType(TokenSupplyType.Finite)
        .setCustomFees([nftCustomFee])
        .setMaxSupply(100)
        .setSupplyKey(myPrivateKey)
        .freezeWith(client);

    //Sign the transaction with the treasury key
    let nftCreateTxSign = await nftCreate.sign(myPrivateKey);

    //Submit the transaction to a Hedera network
    let nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    let nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    let tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log(`NFT is Created with TokenId: ${tokenId} \n`);

    return tokenId;
}
async function mintNft(tokenId) {
    //IPFS content identifiers for which we will create a NFT
    CID = "bafybeig5vygdwxnahwgp7vku6kyz4e3hdjsg4uikfz5sujbsummozw3wp4";

    // Mint new NFT
    let mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(CID)])
        .freezeWith(client);

    //Sign the transaction with the supply key
    let mintTxSign = await mintTx.sign(myPrivateKey);

    //Submit the transaction to a Hedera network
    let mintTxSubmit = await mintTxSign.execute(client);

    //Get the transaction receipt
    let mintRx = await mintTxSubmit.getReceipt(client);

    //Log the serial number
    console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);

    let balanceCheckTx = await new AccountBalanceQuery().setAccountId(myAccountId).execute(client);

    console.log(`- User balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
}

async function associateToken(tokenId) {
    // const tokenId = '0.0.3419851'
    const wallet = new Wallet(
        otherAccountId,
        otherPrivateKey
    );
    //  Before an account that is not the treasury for a token can receive or send this specific token ID, the account
    //  must become “associated” with the token.
    let associateBuyerTx = await new TokenAssociateTransaction()
        .setAccountId(wallet.accountId)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(otherPrivateKey)

    //SUBMIT THE TRANSACTION
    let associateBuyerTxSubmit = await associateBuyerTx.execute(client);

    //GET THE RECEIPT OF THE TRANSACTION
    let associateBuyerRx = await associateBuyerTxSubmit.getReceipt(client);

    //LOG THE TRANSACTION STATUS
    console.log(`- Token association with the users account: ${associateBuyerRx.status} \n`);

}

async function transfer(tokenId) {
    // const tokenId = '0.0.3419851'
    // Transfer the NFT from treasury to Alice
    // Sign with the treasury key to authorize the transfer
    let tokenTransferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, myAccountId, otherAccountId)
        .freezeWith(client)
        .sign(myPrivateKey);

    let tokenTransferSubmit = await tokenTransferTx.execute(client);
    let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    console.log(`\n- NFT transfer from Treasury to Buyer: ${tokenTransferRx.status} \n`);
}

main()