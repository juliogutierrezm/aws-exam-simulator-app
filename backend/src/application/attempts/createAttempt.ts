import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { documentClient, tableName } from "../../infrastructure/dynamodb/client.js";

type CreateAttemptInput = {
  attemptId: string;
  userId: string;
  examId: string;
  certificationId: string;
  startedAt: string;
};

export const createAttempt = async (
  input: CreateAttemptInput
): Promise<void> => {
  const command = new PutCommand({
    TableName: tableName,

    Item: {
      PK: `ATTEMPT#${input.attemptId}`,
      SK: "META",

      attemptId: input.attemptId,
      userId: input.userId,
      examId: input.examId,
      certificationId: input.certificationId,
      status: "IN_PROGRESS",
      startedAt: input.startedAt,

      GSI1PK: `USER#${input.userId}`,
      GSI1SK: `ATTEMPT#${input.startedAt}#${input.attemptId}`
    }
  });

  await documentClient.send(command);
};