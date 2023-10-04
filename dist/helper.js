"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerIdCohortFromDynamo = exports.delClientFromDynamo = exports.delPartnerFromCohortTable = exports.addClientToDynamo = exports.getPartners = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const _config = {};
let dynamoClient = new client_dynamodb_1.DynamoDBClient(_config);
const getPartners = async (cohort) => {
    const params = {
        TableName: process.env.COHORT_TABLE_NAME,
        KeyConditionExpression: "cohort = :c ",
        ExpressionAttributeValues: {
            ":c": { S: cohort, },
        },
    };
    return await dynamoClient.send(new client_dynamodb_1.QueryCommand(params));
};
exports.getPartners = getPartners;
const addClientToCohortTable = async (cohort, partner_id, connection_id) => {
    const Item = {
        cohort: {
            S: cohort,
        },
        partner_id: {
            S: partner_id,
        },
        connection_id: {
            S: connection_id,
        },
    };
    const input = {
        TableName: process.env.COHORT_TABLE_NAME,
        Item,
    };
    const command = new client_dynamodb_1.PutItemCommand(input);
    return dynamoClient.send(command);
};
const addClientToDynamo = async (connection_id, partner_id, cohort) => {
    await addClientToCohortTable(cohort, partner_id, connection_id);
    const Item = {
        connection_id: {
            S: connection_id,
        },
        partner_id: {
            S: partner_id,
        },
        cohort: {
            S: cohort,
        },
    };
    const input = {
        TableName: process.env.CONNECTION_TABLE_NAME,
        Item,
    };
    const command = new client_dynamodb_1.PutItemCommand(input);
    return dynamoClient.send(command);
};
exports.addClientToDynamo = addClientToDynamo;
const delPartnerFromCohortTable = (cohort, partner_id) => {
    const Key = {
        cohort: {
            S: cohort,
        },
        partner_id: {
            S: partner_id,
        },
    };
    const input = {
        TableName: process.env.COHORT_TABLE_NAME,
        Key,
    };
    const command = new client_dynamodb_1.DeleteItemCommand(input);
    return dynamoClient.send(command);
};
exports.delPartnerFromCohortTable = delPartnerFromCohortTable;
const delClientFromDynamo = async (connection_id) => {
    const partnerIdCohortResponse = await (0, exports.getPartnerIdCohortFromDynamo)(connection_id);
    if (partnerIdCohortResponse.Item !== undefined) {
        if (partnerIdCohortResponse.Item.cohort.S !== undefined && partnerIdCohortResponse.Item.partner_id.S !== undefined) {
            await (0, exports.delPartnerFromCohortTable)(partnerIdCohortResponse.Item.cohort.S, partnerIdCohortResponse.Item.partner_id.S);
        }
    }
    const Key = {
        connection_id: {
            S: connection_id,
        },
    };
    const input = {
        TableName: process.env.CONNECTION_TABLE_NAME,
        Key,
    };
    const command = new client_dynamodb_1.DeleteItemCommand(input);
    return dynamoClient.send(command);
};
exports.delClientFromDynamo = delClientFromDynamo;
const getPartnerIdCohortFromDynamo = (connection_id) => {
    const Key = {
        connection_id: {
            S: connection_id,
        },
    };
    const input = {
        TableName: process.env.CONNECTION_TABLE_NAME,
        Key,
    };
    const command = new client_dynamodb_1.GetItemCommand(input);
    return dynamoClient.send(command);
};
exports.getPartnerIdCohortFromDynamo = getPartnerIdCohortFromDynamo;
