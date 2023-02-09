
const {
    PrngTransaction } = require("@hashgraph/sdk");

const generate = async (client, range) => {
    //Create the transaction with range set
    const transaction = await new PrngTransaction()
        //Set the range
        .setRange(range)
        .execute(client);

    //Get the record
    const transactionRecord = await transaction.getRecord(client);

    //Get the number
    const prngNumber = transactionRecord.prngNumber;

    console.log('Random Number Generated is: ', prngNumber);
    return prngNumber;


}

exports.generate = (client, range) => generate(client, range);