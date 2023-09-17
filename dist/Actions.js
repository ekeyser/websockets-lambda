import { LambdaClient, InvokeCommand, } from '@aws-sdk/client-lambda';
import { TextEncoder } from "util";
export class Actions {
    constructor(event, oBody) {
        this.init = () => {
            const _config = {
                endpoint: process.env.LAMBDAENDPOINT,
            };
            let client = new LambdaClient(_config);
            const FunctionName = process.env.INVOKE_FUNCTION_NAME;
            const payload = this.oBody;
            const enc = new TextEncoder();
            let Payload = enc.encode(JSON.stringify(payload));
            const InvocationType = 'Event';
            let params = {
                FunctionName,
                Payload,
                InvocationType,
            };
            let cmd = new InvokeCommand(params);
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
