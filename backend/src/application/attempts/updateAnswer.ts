import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import {
  documentClient,
  tableName
} from "../../infrastructure/dynamodb/client.js";

type UpdateAnswerInput = {
  attemptId: string;
  userId: string;
  questionId: string;
  selectedAnswers: string[];
  markedForReview: boolean;
  updatedAt: string;
};

export const updateAnswer = async (
  input: UpdateAnswerInput
): Promise<void> => {
  const command = new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: tableName,

          Key: {
            PK: `ATTEMPT#${input.attemptId}`,
            SK: "META"
          },

          UpdateExpression:
            "SET answerRevision = if_not_exists(answerRevision, :zero) + :one",

          ConditionExpression:
            "userId = :userId AND #status = :inProgress AND contains(questionIds, :questionId)",

          ExpressionAttributeNames: {
            "#status": "status"
          },

          ExpressionAttributeValues: {
            ":userId": input.userId,
            ":inProgress": "IN_PROGRESS",
            ":questionId": input.questionId,
            ":zero": 0,
            ":one": 1
          }
        }
      },
      {
        Update: {
          TableName: tableName,

          Key: {
            PK: `ATTEMPT#${input.attemptId}`,
            SK: `ANSWER#${input.questionId}`
          },

          UpdateExpression:
            "SET selectedAnswers = :selectedAnswers, markedForReview = :markedForReview, updatedAt = :updatedAt",

          ExpressionAttributeValues: {
            ":selectedAnswers": input.selectedAnswers,
            ":markedForReview": input.markedForReview,
            ":updatedAt": input.updatedAt
          }
        }
      }
    ]
  });

  await documentClient.send(command);
};