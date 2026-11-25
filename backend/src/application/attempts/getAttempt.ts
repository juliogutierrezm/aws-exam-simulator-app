import {
  GetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";

import {
  documentClient,
  tableName
} from "../../infrastructure/dynamodb/client.js";

export const getAttemptMetadata = async (
  attemptId: string
) => {
  const response = await documentClient.send(
    new GetCommand({
      TableName: tableName,

      Key: {
        PK: `ATTEMPT#${attemptId}`,
        SK: "META"
      },

      ConsistentRead: true
    })
  );

  return response.Item ?? null;
};

export const getAttempt = async (
  attemptId: string
) => {
  const items: Record<string, any>[] = [];

  let lastEvaluatedKey:
    | Record<string, any>
    | undefined;

  do {
    const response = await documentClient.send(
      new QueryCommand({
        TableName: tableName,

        KeyConditionExpression: "PK = :pk",

        ExpressionAttributeValues: {
          ":pk": `ATTEMPT#${attemptId}`
        },

        ConsistentRead: true,

        ...(lastEvaluatedKey
          ? {
              ExclusiveStartKey: lastEvaluatedKey
            }
          : {})
      })
    );

    items.push(...(response.Items ?? []));

    lastEvaluatedKey =
      response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};