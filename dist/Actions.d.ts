import { APIGatewayProxyEvent } from "aws-lambda";
export declare class Actions {
    event: APIGatewayProxyEvent;
    oBody: {};
    constructor(event: APIGatewayProxyEvent, oBody: {});
    init: () => unknown;
}
