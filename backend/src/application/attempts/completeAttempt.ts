import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import {
  documentClient,
  tableName
} from "../../infrastructure/dynamodb/client.js";

type CompleteAttemptInput = {
  attemptId: string;
  userId: string;

  expectedAnswerRevision: number;

  score: number;

  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;

  durationSeconds: number;
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

    UpdateExpression: [
      "SET #status = :completed",
      "completedAt = :completedAt",
      "score = :score",
      "correctCount = :correctCount",
      "incorrectCount = :incorrectCount",
      "unansweredCount = :unansweredCount",
      "totalQuestions = :totalQuestions",
      "durationSeconds = :durationSeconds"
    ].join(", "),

    ConditionExpression: [
      "attribute_exists(PK)",
      "userId = :userId",
      "#status = :inProgress",
      "(" +
        "answerRevision = :expectedRevision" +
        " OR " +
        "(" +
          "attribute_not_exists(answerRevision)" +
          " AND :expectedRevision = :zero" +
        ")" +
      ")"
    ].join(" AND "),

    ExpressionAttributeNames: {
      "#status": "status"
    },

    ExpressionAttributeValues: {
      ":userId": input.userId,

      ":inProgress": "IN_PROGRESS",
      ":completed": "COMPLETED",

      ":expectedRevision":
        input.expectedAnswerRevision,

      ":zero": 0,

      ":completedAt": input.completedAt,
      ":score": input.score,

      ":correctCount": input.correctCount,
      ":incorrectCount": input.incorrectCount,
      ":unansweredCount": input.unansweredCount,
      ":totalQuestions": input.totalQuestions,

      ":durationSeconds": input.durationSeconds
    }
  });

  await documentClient.send(command);
};