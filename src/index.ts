import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
    PostToConnectionCommandInput,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
    // DynamoDBClient,
    // PutItemCommand,
    // GetItemCommand,
    // DeleteItemCommand,
    // QueryCommand,
    QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import {
    getPartners,
    addClientToDynamo,
    delClientFromDynamo,
} from './helper.js'
import {
    APIGatewayEvent,
    APIGatewayProxyEvent,
    Handler,
} from 'aws-lambda';
import {Actions} from './Actions.js';
import {TextEncoder} from "util";

export type TConfig = {
    Handlers: {
        connect: Function[],
        disconnect: Function[],
        sendmessage: Function[],
        _default: Function[],
    },
}

class WebsocketsLambda {

    event
    config

    constructor(event: APIGatewayProxyEvent, config: TConfig) {
        this.event = event
        this.config = config
    }

    main = async (event: APIGatewayProxyEvent, config: TConfig) => {

        const {
            requestContext: {connectionId, routeKey, eventType},
        } = event;


        if (routeKey === "$connect") {

            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                },
                body: "connected",
                isBase64Encoded: false,
            };
        }


        if (routeKey === "$disconnect") {

            try {

                const _disconnectHandlers = config.Handlers.disconnect
                _disconnectHandlers.forEach(async (_handler) => {

                    await _handler(connectionId)
                })
            } catch (e) {

                console.error(e);
            }

            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                },
                body: "disconnected",
                isBase64Encoded: false,
            };
        }


        if (routeKey === "sendmessage") {

            const responseBody = {
                message: 'amessage',
            }


            const _sendMessageHandlers = config.Handlers.sendmessage
            _sendMessageHandlers.forEach(async (_handler) => {

                await _handler()
            })

            return {
                statusCode: 200,
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(responseBody),
                isBase64Encoded: false,
            }
        }


        if (routeKey === '$default') {

            let oBody;
            if (event.body) oBody = JSON.parse(event.body);


            let _send: Function;

            const _begin = (event: APIGatewayProxyEvent) => {

                const _config = {
                    apiVersion: "2018-11-29",
                    endpoint: "https://" + event.requestContext.domainName,
                };
                const client = new ApiGatewayManagementApiClient(_config);

                _send = async (ConnectionId: string, data: {}) => {

                    const enc = new TextEncoder();

                    let Data: PostToConnectionCommandInput["Data"] = enc.encode(JSON.stringify(data));

                    const input: PostToConnectionCommandInput = {
                        ConnectionId,
                        Data,
                    };
                    const command: PostToConnectionCommand = new PostToConnectionCommand(input);

                    return await client.send(command);
                };
            };


            const registerClientConnection = async (event: APIGatewayProxyEvent, connectionId: string, oBody: {
                cohort: string,
                partner_id: string,
            }) => {

                try {

                    await addClientToDynamo(connectionId, oBody.partner_id, oBody.cohort);
                } catch (e) {

                    console.error(e);
                }

                _begin(event);
                const _payload = {
                    type: 'message',
                    body: {
                        message: 'Client registered as listener.',
                    },
                };
                await _send(connectionId, _payload);
            };


            /*
            Main function where inventory payloads are dropped
             */
            const handleInventoryMessage = async (event: APIGatewayProxyEvent, oBody: {}) => {

                const actions = new Actions(event, oBody);
                await actions.init();

            };


            const handleNotificationMessage = async (event: APIGatewayProxyEvent, oBody: {
                cohort: string,
            }) => {

                console.log(event);
                console.log(`...........${connectionId}.......${routeKey}.......${eventType}`);
                let objDynamoResponse: QueryCommandOutput = await getPartners(oBody.cohort);

                if (objDynamoResponse.Items !== undefined) {

                    for (let i = 0; i < objDynamoResponse.Items.length; i++) {

                        _begin(event);
                        const _payload = {
                            type: 'resource-update',
                            body: oBody,
                        };
                        try {

                            await _send(objDynamoResponse.Items[i].connection_id.S, _payload);
                        } catch (e) {

                            console.error(e);
                        }
                    }
                } else {

                    console.warn(`No partners for notification message.`);
                }
            };


            const handleDefaultActionMessage = async (event: APIGatewayProxyEvent, oBody: {
                cohort: string,
            }) => {

                let objDynamoResponse: QueryCommandOutput = await getPartners(oBody.cohort);

                if (objDynamoResponse.Items !== undefined) {

                    for (let i = 0; i < objDynamoResponse.Items.length; i++) {

                        _begin(event);
                        const _payload = {
                            type: 'default-action',
                            body: oBody,
                        };
                        await _send(objDynamoResponse.Items[i].connection_id.S, _payload);
                    }
                } else {

                    console.warn(`No partners for default action.`);
                }
            };


            const handleEmptyActionMessage = async (event: APIGatewayProxyEvent, connectionId: string) => {

                _begin(event);
                const _payload = {
                    type: 'message',
                    body: {
                        message: 'No "payload" property set.',
                    },
                };
                await _send(connectionId, _payload);
            };


            if (oBody.partner_id !== undefined && oBody.cohort !== undefined) {

                if (connectionId) await registerClientConnection(event, connectionId, oBody);
            } else {

                if (oBody.action !== undefined) {

                    switch (oBody.action) {

                        case 'inventory':
                            await handleInventoryMessage(event, oBody);
                            break;

                        case 'notifyfe':
                            await handleNotificationMessage(event, oBody);
                            break;

                        default:
                            await handleDefaultActionMessage(event, oBody);
                    }
                } else {

                    if (connectionId) await handleEmptyActionMessage(event, connectionId);
                }

            }

            return {};
        }

        return {};
    }

    init = () => {

        return this.main(this.event, this.config)
    }
}

export {WebsocketsLambda}