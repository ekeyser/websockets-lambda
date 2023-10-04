"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const util_1 = require("util");
class Actions {
    constructor(event, oBody) {
        this.init = () => {
            const _config = {
                endpoint: process.env.LAMBDAENDPOINT,
            };
            let client = new client_lambda_1.LambdaClient(_config);
            const FunctionName = process.env.INVOKE_FUNCTION_NAME;
            const payload = this.oBody;
            const enc = new util_1.TextEncoder();
            let Payload = enc.encode(JSON.stringify(payload));
            const InvocationType = 'Event';
            let params = {
                FunctionName,
                Payload,
                InvocationType,
            };
            let cmd = new client_lambda_1.InvokeCommand(params);
            try {
                return client.send(cmd);
            }
            catch (e) {
                console.error(e);
                return e;
            }
        };
        this.event = event;
        this.oBody = oBody;
    }
}
exports.Actions = Actions;
