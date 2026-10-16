import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { documentClient } from "../../infrastructure/dynamodb/client.js";

type UpdateAnswerInput = {
  attemptId: string;
  questionId: string;
  selectedAnswers: string[];
  markedForReview: boolean;
  updatedAt: string;
};

export const updateAnswer = async (
  input: UpdateAnswerInput
): Promise<void> => {
  const command = new UpdateCommand({
    TableName: "cloudcase-hub-dev-user-data",

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
  });

  await documentClient.send(command);
};