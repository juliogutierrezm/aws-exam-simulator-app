import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

export const contentDocumentClient =
  DynamoDBDocumentClient.from(client);

const tableName = process.env.CONTENT_TABLE_NAME;

if (!tableName) {
  throw new Error(
    "CONTENT_TABLE_NAME environment variable is required"
  );
}

export const contentTableName: string = tableName;