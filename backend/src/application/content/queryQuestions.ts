import {
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

import {
  contentDocumentClient,
  contentTableName
} from "../../infrastructure/dynamodb/content.js";

export type QueryQuestionsInput = {
  examId?: string;
  certificationId?: string;
  domain?: string;
  selectCount?: number;
  service?: string;
  concept?: string;
  limit?: number;
  nextToken?: string;
};

type PublicQuestion = {
  questionId: string;
  examId: string;
  certificationId: string;
  catalogVersion: string;
  bankIndex: number;
  examDomain: string;
  selectCount: number;
  question: {
    scenario: string;
    options: Array<{
      id: string;
      text: string;
    }>;
  };
  metadata: {
    primary_services?: string[];
    mentioned_services?: string[];
    concepts?: string[];
    difficulty?: string;
    question_style?: string;
    architecture_patterns?: string[];
    [key: string]: unknown;
  };
  references: string[];
};

type QueryQuestionsResult = {
  items: PublicQuestion[];
  nextToken: string | null;
};

const encodeToken = (
  key: Record<string, unknown> | undefined
): string | null => {
  if (!key) {
    return null;
  }

  return Buffer.from(
    JSON.stringify(key)
  ).toString("base64");
};

const decodeToken = (
  token?: string
): Record<string, unknown> | undefined => {
  if (!token) {
    return undefined;
  }

  return JSON.parse(
    Buffer.from(token, "base64").toString("utf8")
  );
};

const toPublicQuestion = (
  item: Record<string, any>
): PublicQuestion => ({
  questionId: item.questionId,
  examId: item.examId,
  certificationId: item.certificationId,
  catalogVersion: item.catalogVersion,
  bankIndex: item.bankIndex,
  examDomain: item.examDomain,
  selectCount: item.selectCount,
  question: item.question,
  metadata: item.metadata ?? {},
  references: item.references ?? []
});

const matchesFilters = (
  item: Record<string, any>,
  input: QueryQuestionsInput
): boolean => {
  if (
    input.certificationId &&
    item.certificationId !== input.certificationId
  ) {
    return false;
  }

  if (
    input.domain &&
    item.examDomain !== input.domain
  ) {
    return false;
  }

  if (
    input.selectCount !== undefined &&
    item.selectCount !== input.selectCount
  ) {
    return false;
  }

  if (input.service) {
    const primaryServices =
      item.metadata?.primary_services ?? [];

    const mentionedServices =
      item.metadata?.mentioned_services ?? [];
    const services = new Set([
      ...primaryServices,
      ...mentionedServices
    ]);

    if (!services.has(input.service)) {
      return false;
    }
  }

  if (input.concept) {
    const concepts =
      item.metadata?.concepts ?? [];

    if (!concepts.includes(input.concept)) {
      return false;
    }
  }

  return true;
};

export const queryQuestions = async (
  input: QueryQuestionsInput
): Promise<QueryQuestionsResult> => {
  const exclusiveStartKey =
    decodeToken(input.nextToken);

  const limit = Math.min(
    Math.max(input.limit ?? 50, 1),
    100
  );

  let items: Record<string, any>[] = [];
  let lastEvaluatedKey:
    | Record<string, unknown>
    | undefined;

  if (input.examId) {
    const response =
      await contentDocumentClient.send(
        new QueryCommand({
          TableName: contentTableName,
          IndexName: "GSI1",

          KeyConditionExpression:
            "GSI1PK = :gsi1pk",

          ExpressionAttributeValues: {
            ":gsi1pk":
              `EXAM#${input.examId}`
          },

          ExclusiveStartKey:
            exclusiveStartKey,

          Limit: limit
        })
      );

    items = response.Items ?? [];
    lastEvaluatedKey =
      response.LastEvaluatedKey;
  } else {
    const response =
      await contentDocumentClient.send(
        new ScanCommand({
          TableName: contentTableName,

          ExclusiveStartKey:
            exclusiveStartKey,

          Limit: limit
        })
      );

    items = response.Items ?? [];
    lastEvaluatedKey =
      response.LastEvaluatedKey;
  }

  const filteredItems = items
    .filter((item) =>
      matchesFilters(item, input)
    )
    .map(toPublicQuestion);

  return {
    items: filteredItems,
    nextToken:
      encodeToken(lastEvaluatedKey)
  };
};