"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketsLambda = void 0;
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
const helper_js_1 = require("./helper.js");
const Actions_js_1 = require("./Actions.js");
const util_1 = require("util");
class WebsocketsLambda {
    constructor(event, config) {
        this.main = async (event, config) => {
            const { requestContext: { connectionId, routeKey, eventType }, } = event;
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
                    const _disconnectHandlers = config.Handlers.disconnect;
                    _disconnectHandlers.forEach(async (_handler) => {
                        await _handler(connectionId);
                    });
                }
                catch (e) {
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
                };
                const _sendMessageHandlers = config.Handlers.sendmessage;
                _sendMessageHandlers.forEach(async (_handler) => {
                    await _handler();
                });
                return {
                    statusCode: 200,
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify(responseBody),
                    isBase64Encoded: false,
                };
            }
            if (routeKey === '$default') {
                let oBody;
                if (event.body)
                    oBody = JSON.parse(event.body);
                let _send;
                const _begin = (event) => {
                    const _config = {
                        apiVersion: "2018-11-29",
                        endpoint: "https://" + event.requestContext.domainName,
                    };
                    const client = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient(_config);
                    _send = async (ConnectionId, data) => {
                        const enc = new util_1.TextEncoder();
                        let Data = enc.encode(JSON.stringify(data));
                        const input = {
                            ConnectionId,
                            Data,
                        };
                        const command = new client_apigatewaymanagementapi_1.PostToConnectionCommand(input);
                        return await client.send(command);
                    };
                };
                const registerClientConnection = async (event, connectionId, oBody) => {
                    try {
                        await (0, helper_js_1.addClientToDynamo)(connectionId, oBody.partner_id, oBody.cohort);
                    }
                    catch (e) {
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
                const handleInventoryMessage = async (event, oBody) => {
                    const actions = new Actions_js_1.Actions(event, oBody);
                    await actions.init();
                };
                const handleNotificationMessage = async (event, oBody) => {
                    console.log(event);
                    console.log(`...........${connectionId}.......${routeKey}.......${eventType}`);
                    let objDynamoResponse = await (0, helper_js_1.getPartners)(oBody.cohort);
                    if (objDynamoResponse.Items !== undefined) {
                        for (let i = 0; i < objDynamoResponse.Items.length; i++) {
                            _begin(event);
                            const _payload = {
                                type: 'resource-update',
                                body: oBody,
                            };
                            try {
                                await _send(objDynamoResponse.Items[i].connection_id.S, _payload);
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                    }
                    else {
                        console.warn(`No partners for notification message.`);
                    }
                };
                const handleDefaultActionMessage = async (event, oBody) => {
                    let objDynamoResponse = await (0, helper_js_1.getPartners)(oBody.cohort);
                    if (objDynamoResponse.Items !== undefined) {
                        for (let i = 0; i < objDynamoResponse.Items.length; i++) {
                            _begin(event);
                            const _payload = {
                                type: 'default-action',
                                body: oBody,
                            };
                            await _send(objDynamoResponse.Items[i].connection_id.S, _payload);
                        }
                    }
                    else {
                        console.warn(`No partners for default action.`);
                    }
                };
                const handleEmptyActionMessage = async (event, connectionId) => {
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
                    if (connectionId)
                        await registerClientConnection(event, connectionId, oBody);
                }
                else {
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
                    }
                    else {
                        if (connectionId)
                            await handleEmptyActionMessage(event, connectionId);
                    }
                }
                return {};
            }
            return {};
        };
        this.init = () => {
            return this.main(this.event, this.config);
        };
        this.event = event;
        this.config = config;
    }
}
exports.WebsocketsLambda = WebsocketsLambda;
