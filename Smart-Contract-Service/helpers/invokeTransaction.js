
const { ContractExecuteTransaction, ContractCallQuery, Hbar } = require("@hashgraph/sdk");
const { hethers } = require('@hashgraph/hethers');

const abicoder = new hethers.utils.AbiCoder();

const invoke = async (client, contractId, paramObj) => {
    //Create the transaction to update the contract message
    const contractExecTx = await new ContractExecuteTransaction()
        //Set the ID of the contract
        .setContractId(contractId)
        //Set the gas for the contract call
        .setGas(100000)
        //Set the contract function to call
        .setFunction("setMobileNumber", paramObj)//.addUint16(7));

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);

    //Get the receipt of the transaction
    const receipt2 = await submitExecTx.getReceipt(client);

    //Confirm the transaction was executed successfully
    console.log("The transaction status is " + receipt2.status.toString());

}

const query = async (client, contractId, paramObj) => {

    //Create the transaction to update the contract message
    const contractCallQuery = await new ContractCallQuery()
        //Set the ID of the contract
        .setContractId(contractId)
        //Set the gas for the contract call
        .setGas(100000)
        //Set the contract function to call
        .setFunction("getMobileNumber", paramObj)
        .setQueryPayment(new Hbar(10));

    //Submit the transaction to a Hedera network and store the response
    const contractQuerySubmit = await contractCallQuery.execute(client);
    console.log('Retrieved data is ' + contractQuerySubmit.getUint256(0).toString())


}

exports.invoke = (client, contractId, paramObj) => invoke(client, contractId, paramObj);
exports.query = (client, contractId, paramObj) => query(client, contractId, paramObj);
