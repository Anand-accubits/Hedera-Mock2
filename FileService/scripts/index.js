const {
    FileCreateTransaction,
    FileAppendTransaction,
    FileContentsQuery,
    Hbar,
    LocalProvider,
    Wallet
} = require("@hashgraph/sdk");
require('dotenv').config();

if (process.env.MY_ACCOUNT_ID == null || process.env.MY_PRIVATE_KEY == null) {
    throw new Error(
        "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
    );
}

const wallet = new Wallet(
    process.env.MY_ACCOUNT_ID,
    process.env.MY_PRIVATE_KEY,
    new LocalProvider()
);

async function main() {
    console.log("Creating an Empty File")
    // Create a file on Hedera and store file
    let fileCreateTransaction = await new FileCreateTransaction()
        .setKeys([wallet.getAccountKey()])
        .setContents("")
        .setMaxTransactionFee(new Hbar(2))
        .freezeWithSigner(wallet);
    fileCreateTransaction = await fileCreateTransaction.signWithSigner(wallet);
    const txCreateResponse = await fileCreateTransaction.executeWithSigner(wallet);

    //Get the receipt of the transaction
    const createReceipt = await txCreateResponse.getReceiptWithSigner(wallet);

    //Grab the new file ID from the receipt
    const fileId = createReceipt.fileId;
    console.log(`Your file ID is: ${fileId}`);

    // UPDATE CONTENT
    console.log("Updating Content of the file")

    // // Fees can be calculated with the fee estimator https://hedera.com/fees
    const txAppendResponse = await (
        await (
            await new FileAppendTransaction()
                .setNodeAccountIds([txCreateResponse.nodeId])
                .setFileId(fileId)
                .setContents("Hello")
                .setMaxTransactionFee(new Hbar(5))
                .freezeWithSigner(wallet)
        ).signWithSigner(wallet)
    ).executeWithSigner(wallet);

    const appendReceipt = await txAppendResponse.getReceiptWithSigner(wallet);

    const contents = await new FileContentsQuery()
        .setFileId(fileId)
        .executeWithSigner(wallet);

    console.log(`File content length according to \`FileInfoQuery\`: ${contents.length}`);

    // Retrieve File Data
    await retrieve(fileId)
    process.exit();
}

async function retrieve(fileId) {
    const query = new FileContentsQuery()
        .setFileId(fileId);

    const contents = await query.executeWithSigner(wallet);

    console.log(`The size of the data is ${contents.length}`);
    console.log(`The File content is : ${contents.toString()}`);

    process.exit();
}

main();
