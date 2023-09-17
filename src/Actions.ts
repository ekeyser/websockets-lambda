import {
    LambdaClient,
    InvokeCommand,
    InvokeCommandInput,
    LambdaClientConfig,
} from '@aws-sdk/client-lambda';
import {TextEncoder} from "util";
import {APIGatewayProxyEvent} from "aws-lambda";

export class Actions {

    event;
    oBody: {};

    constructor(event: APIGatewayProxyEvent, oBody: {}) {
        this.event = event;
        this.oBody = oBody;
    }

    init = () => {

        const _config: LambdaClientConfig = {
            endpoint: process.env.LAMBDAENDPOINT,
        }

        let client = new LambdaClient(_config);

        const FunctionName = process.env.INVOKE_FUNCTION_NAME;
        const payload = this.oBody;

        const enc = new TextEncoder();

        let Payload: InvokeCommandInput["Payload"] = enc.encode(JSON.stringify(payload));


        const InvocationType = 'Event';

        let params: InvokeCommandInput = {
            FunctionName,
            Payload,
            InvocationType,
        };


        let cmd = new InvokeCommand(params);

        try {

            return client.send(cmd);
        } catch (e) {

            console.error(e);
            return e;
        }
    };

}
