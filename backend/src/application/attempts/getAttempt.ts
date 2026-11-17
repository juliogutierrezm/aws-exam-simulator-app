import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { documentClient, tableName } from "../../infrastructure/dynamodb/client.js";

export const getAttempt = async (attemptId: string) => {
  const command = new QueryCommand({
    TableName: tableName,

    KeyConditionExpression: "PK = :pk",

    ExpressionAttributeValues: {
      ":pk": `ATTEMPT#${attemptId}`
    }
  });

  const response = await documentClient.send(command);

  return response.Items ?? [];
};