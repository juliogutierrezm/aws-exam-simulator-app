import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

export const documentClient = DynamoDBDocumentClient.from(client);

export const tableName = process.env.TABLE_NAME;

if (!tableName) {
  throw new Error("TABLE_NAME environment variable is required");
}