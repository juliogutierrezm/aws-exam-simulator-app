import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import {
  contentDocumentClient,
  contentTableName
} from "../../infrastructure/dynamodb/content.js";

export type AnswerKeyItem = {
  questionId: string;
  correctAnswers: string[];
};

export const getExamAnswerKey = async (
  examId: string
): Promise<AnswerKeyItem[]> => {
  const response = await contentDocumentClient.send(
    new QueryCommand({
      TableName: contentTableName,
      IndexName: "GSI1",

      KeyConditionExpression: "GSI1PK = :pk",

      ExpressionAttributeValues: {
        ":pk": `EXAM#${examId}`
      },

      ProjectionExpression:
        "questionId, correctAnswers"
    })
  );

  return (response.Items ?? []).map((item) => ({
    questionId: item.questionId,
    correctAnswers: item.correctAnswers ?? []
  }));
};