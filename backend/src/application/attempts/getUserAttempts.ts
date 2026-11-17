import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { documentClient, tableName } from "../../infrastructure/dynamodb/client.js";

export const getUserAttempts = async (userId: string) => {
  const command = new QueryCommand({
    TableName: tableName,

    IndexName: "GSI1",

    KeyConditionExpression: "GSI1PK = :userId",

    ExpressionAttributeValues: {
      ":userId": `USER#${userId}`
    },

    ScanIndexForward: false
  });

  const response = await documentClient.send(command);

  return response.Items ?? [];
};