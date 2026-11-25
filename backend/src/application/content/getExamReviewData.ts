import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import {
  contentDocumentClient,
  contentTableName
} from "../../infrastructure/dynamodb/content.js";

export type ExamReviewItem = {
  questionId: string;
  question: {
    scenario: string;
    options: Array<{
      id: string;
      text: string;
    }>;
  };
  correctAnswers: string[];
  feedback: {
    summary?: string;
    incorrectOptions?: string;
    keyClue?: string;
  };
};

export const getExamReviewData = async (
  examId: string
): Promise<ExamReviewItem[]> => {
  const response = await contentDocumentClient.send(
    new QueryCommand({
      TableName: contentTableName,
      IndexName: "GSI1",

      KeyConditionExpression:
        "GSI1PK = :pk",

      ExpressionAttributeValues: {
        ":pk": `EXAM#${examId}`
      },

      ProjectionExpression:
        "questionId, question, correctAnswers, feedback"
    })
  );

  return (response.Items ?? []).map((item) => ({
    questionId: item.questionId,
    question: item.question,

    correctAnswers:
      item.correctAnswers ?? [],

    feedback: {
      summary:
        item.feedback?.summary,

      incorrectOptions:
        item.feedback?.incorrectOptions,

      keyClue:
        item.feedback?.keyClue
    }
  }));
};