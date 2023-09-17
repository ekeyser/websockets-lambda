import { APIGatewayProxyEvent } from 'aws-lambda';
export type TConfig = {
    Handlers: {
        connect: Function[];
        disconnect: Function[];
        sendmessage: Function[];
        _default: Function[];
    };
};
declare class WebsocketsLambda {
    event: APIGatewayProxyEvent;
    config: TConfig;
    constructor(event: APIGatewayProxyEvent, config: TConfig);
    main: (event: APIGatewayProxyEvent, config: TConfig) => Promise<{
        statusCode: number;
        headers: {
            'content-type': string;
        };
        body: string;
        isBase64Encoded: boolean;
    } | {
        statusCode?: undefined;
        headers?: undefined;
        body?: undefined;
        isBase64Encoded?: undefined;
    }>;
    init: () => Promise<{
        statusCode: number;
        headers: {
            'content-type': string;
        };
        body: string;
        isBase64Encoded: boolean;
    } | {
        statusCode?: undefined;
        headers?: undefined;
        body?: undefined;
        isBase64Encoded?: undefined;
    }>;
}
export { WebsocketsLambda };
