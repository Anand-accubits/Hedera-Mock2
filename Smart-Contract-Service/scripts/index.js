const {
    Client,
    PrivateKey, ContractFunctionParameters } = require("@hashgraph/sdk");
require('dotenv').config({});

const deployer = require('../helpers/deploy')
const invoker = require('../helpers/invokeTransaction')
const random = require('../helpers/generateRandom')

const myAccountId = '0.0.1350';
const myPrivateKey = PrivateKey.fromString('2bf9b263d89a700b66a53dbad55d0a3a372960f6703a2754cff3291242e8f4a2');

// If we weren't able to grab it, we should throw a new error
if (myAccountId == null ||
    myPrivateKey == null) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}

// Create our connection to the Hedera network
// The Hedera JS SDK makes this really easy!
const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

async function main() {
    const contractId = await deployer.deploy(client);
    const randomNumber = await random.generate(client, 123456);
    await invoker.invoke(client, contractId, new ContractFunctionParameters().addString("Alice").addUint256(randomNumber));
    await invoker.query(client, contractId, new ContractFunctionParameters().addString("Alice"));
    process.exit();
}

main();