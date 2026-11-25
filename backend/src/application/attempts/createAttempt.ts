import { PutCommand } from "@aws-sdk/lib-dynamodb";

import {
  documentClient,
  tableName
} from "../../infrastructure/dynamodb/client.js";

export type AttemptMode = "EXAM" | "PRACTICE";

export type AttemptFilters = {
  examId?: string;
  domain?: string;
  service?: string;
  concept?: string;
  selectCount?: number;
};

export type CreateAttemptInput = {
  attemptId: string;
  userId: string;
  certificationId: string;
  catalogVersion: string;

  mode: AttemptMode;
  examId: string | null;
  filters: AttemptFilters;

  questionIds: string[];
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

      certificationId: input.certificationId,
      catalogVersion: input.catalogVersion,

      mode: input.mode,
      examId: input.examId,
      filters: input.filters,

      questionIds: input.questionIds,
      questionCount: input.questionIds.length,

      status: "IN_PROGRESS",
      startedAt: input.startedAt,

      GSI1PK: `USER#${input.userId}`,
      GSI1SK:
        `ATTEMPT#${input.startedAt}#${input.attemptId}`
    },

    ConditionExpression:
      "attribute_not_exists(PK)"
  });

  await documentClient.send(command);
};