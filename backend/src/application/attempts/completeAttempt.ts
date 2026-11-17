import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { documentClient, tableName } from "../../infrastructure/dynamodb/client.js";

type CompleteAttemptInput = {
  attemptId: string;
  score: number;
  completedAt: string;
};

export const completeAttempt = async (
  input: CompleteAttemptInput
): Promise<void> => {
  const command = new UpdateCommand({
    TableName: tableName,

    Key: {
      PK: `ATTEMPT#${input.attemptId}`,
      SK: "META"
    },

    UpdateExpression:
      "SET #status = :status, completedAt = :completedAt, score = :score",

    ExpressionAttributeNames: {
      "#status": "status"
    },

    ExpressionAttributeValues: {
      ":status": "COMPLETED",
      ":completedAt": input.completedAt,
      ":score": input.score
    }
  });

  await documentClient.send(command);
};