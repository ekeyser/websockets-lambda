import {
    DeleteItemCommand,
    DynamoDBClient, DynamoDBClientConfig, GetItemCommand,
    PutItemCommand,
    QueryCommand,
} from "@aws-sdk/client-dynamodb";

const _config: DynamoDBClientConfig = {}
let dynamoClient = new DynamoDBClient(_config);

export const getPartners = async (cohort: string) => {

    const params = {
        TableName: process.env.COHORT_TABLE_NAME,
        KeyConditionExpression: "cohort = :c ",
        ExpressionAttributeValues: {
            ":c": {S: cohort,},
        },
    };

    return await dynamoClient.send(new QueryCommand(params));
}


const addClientToCohortTable = async (cohort: string, partner_id: string, connection_id: string) => {

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

    const command = new PutItemCommand(input);

    return dynamoClient.send(command);
}


export const addClientToDynamo = async (connection_id: string, partner_id: string, cohort: string) => {

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

    const command = new PutItemCommand(input);

    return dynamoClient.send(command);
}


export const delPartnerFromCohortTable = (cohort: string, partner_id: string) => {

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

    const command = new DeleteItemCommand(input);

    return dynamoClient.send(command);
}


export const delClientFromDynamo = async (connection_id: string) => {

    const partnerIdCohortResponse = await getPartnerIdCohortFromDynamo(connection_id);

    if (partnerIdCohortResponse.Item !== undefined) {

        if (partnerIdCohortResponse.Item.cohort.S !== undefined && partnerIdCohortResponse.Item.partner_id.S !== undefined) {

            await delPartnerFromCohortTable(
                partnerIdCohortResponse.Item.cohort.S,
                partnerIdCohortResponse.Item.partner_id.S
            );
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

    const command = new DeleteItemCommand(input);


    return dynamoClient.send(command);
}


export const getPartnerIdCohortFromDynamo = (connection_id: string) => {

    const Key = {
        connection_id: {
            S: connection_id,
        },
    };

    const input = {
        TableName: process.env.CONNECTION_TABLE_NAME,
        Key,
    };

    const command = new GetItemCommand(input);

    return dynamoClient.send(command);
}