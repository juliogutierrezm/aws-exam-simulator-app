import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import {
  contentDocumentClient,
  contentTableName
} from "../../infrastructure/dynamodb/content.js";

type GetQuestionsByIdsInput = {
  questionIds: string[];
  catalogVersion: string;
};

export type PrivateQuestion = {
  questionId: string;
  examId: string;
  certificationId: string;
  catalogVersion: string;
  selectCount: number;
  examDomain: string;

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

  metadata: {
    primary_services?: string[];
    mentioned_services?: string[];
    concepts?: string[];
    architecture_patterns?: string[];
    difficulty?: string;
    question_style?: string;
  };
};

export const getQuestionsByIds = async (
  input: GetQuestionsByIdsInput
): Promise<PrivateQuestion[]> => {
  const questionIds = [
    ...new Set(input.questionIds)
  ];

  const questions = new Map<string, PrivateQuestion>();

  for (let i = 0; i < questionIds.length; i += 100) {
    const batch = questionIds.slice(i, i + 100);

    let keys: Record<string, any>[] = batch.map(
      (questionId) => ({
        PK: `QUESTION#${questionId}`,
        SK: `VERSION#${input.catalogVersion}`
      })
    );

    let retries = 0;

    while (keys.length > 0) {
      const response = await contentDocumentClient.send(
        new BatchGetCommand({
          RequestItems: {
            [contentTableName]: {
              Keys: keys,
              ConsistentRead: true
            }
          }
        })
      );

      const items =
        response.Responses?.[contentTableName] ?? [];

      for (const item of items) {
        if (
          !Array.isArray(item.correctAnswers) ||
          item.correctAnswers.length === 0
        ) {
          throw new Error(
            `Invalid answer key for ${item.questionId}`
          );
        }

        questions.set(item.questionId, {
          questionId: item.questionId,
          examId: item.examId,
          certificationId: item.certificationId,
          catalogVersion: item.catalogVersion,
          selectCount: item.selectCount,
          examDomain: item.examDomain,
          question: item.question,
          correctAnswers: item.correctAnswers,
          feedback: item.feedback ?? {},
          metadata: item.metadata ?? {}
        });
      }

      keys =
        response.UnprocessedKeys?.[contentTableName]?.Keys ?? [];

      if (keys.length > 0) {
        retries++;

        if (retries > 5) {
          throw new Error(
            "Unable to retrieve all requested questions"
          );
        }

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            100 * 2 ** (retries - 1)
          )
        );
      }
    }
  }

  return questionIds.map((questionId) => {
    const question = questions.get(questionId);

    if (!question) {
      throw new Error(
        `Question not found: ${questionId}`
      );
    }

    return question;
  });
};