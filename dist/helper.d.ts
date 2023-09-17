export declare const getPartners: (cohort: string) => Promise<import("@aws-sdk/client-dynamodb").QueryCommandOutput>;
export declare const addClientToDynamo: (connection_id: string, partner_id: string, cohort: string) => Promise<import("@aws-sdk/client-dynamodb").PutItemCommandOutput>;
export declare const delPartnerFromCohortTable: (cohort: string, partner_id: string) => Promise<import("@aws-sdk/client-dynamodb").DeleteItemCommandOutput>;
export declare const delClientFromDynamo: (connection_id: string) => Promise<import("@aws-sdk/client-dynamodb").DeleteItemCommandOutput>;
export declare const getPartnerIdCohortFromDynamo: (connection_id: string) => Promise<import("@aws-sdk/client-dynamodb").GetItemCommandOutput>;
