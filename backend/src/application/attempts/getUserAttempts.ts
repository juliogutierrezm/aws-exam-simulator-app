import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import {
  documentClient,
  tableName
} from "../../infrastructure/dynamodb/client.js";

import type {
  AttemptMode,
  AttemptFilters
} from "./createAttempt.js";

export type GetUserAttemptsInput = {
  userId: string;

  certificationId?: string;
  mode?: AttemptMode;
  examId?: string;
  status?: "IN_PROGRESS" | "COMPLETED";

  service?: string;
  domain?: string;
  concept?: string;
  selectCount?: number;

  limit?: number;
  nextToken?: string;
};

export type UserAttempt = {
  attemptId: string;

  certificationId: string;
  catalogVersion: string;

  mode: AttemptMode;
  examId: string | null;
  filters: AttemptFilters;

  status: string;

  questionCount: number;
  totalQuestions: number;

  score: number | null;

  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;

  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
};

type GetUserAttemptsResult = {
  items: UserAttempt[];
  nextToken: string | null;
};

export class InvalidAttemptTokenError extends Error {
  constructor() {
    super("Invalid pagination token");
    this.name = "InvalidAttemptTokenError";
  }
}

const encodeToken = (
  key: Record<string, unknown> | undefined
): string | null => {
  if (!key) {
    return null;
  }

  return Buffer.from(
    JSON.stringify(key)
  ).toString("base64url");
};

const decodeToken = (
  token: string | undefined,
  userId: string
): Record<string, any> | undefined => {
  if (!token) {
    return undefined;
  }

  try {
    const key = JSON.parse(
      Buffer.from(
        token,
        "base64url"
      ).toString("utf8")
    );

    if (
      !key ||
      typeof key !== "object" ||
      Array.isArray(key) ||
      typeof key.PK !== "string" ||
      !key.PK.startsWith("ATTEMPT#") ||
      key.SK !== "META" ||
      key.GSI1PK !== `USER#${userId}` ||
      typeof key.GSI1SK !== "string" ||
      !key.GSI1SK.startsWith("ATTEMPT#")
    ) {
      throw new InvalidAttemptTokenError();
    }

    return {
      PK: key.PK,
      SK: key.SK,
      GSI1PK: key.GSI1PK,
      GSI1SK: key.GSI1SK
    };
  } catch {
    throw new InvalidAttemptTokenError();
  }
};

const matchesFilters = (
  item: Record<string, any>,
  input: GetUserAttemptsInput
): boolean => {
  const mode = item.mode ?? "EXAM";
  const filters = item.filters ?? {};

  if (
    input.certificationId &&
    item.certificationId !== input.certificationId
  ) {
    return false;
  }

  if (
    input.mode &&
    mode !== input.mode
  ) {
    return false;
  }

  if (
    input.examId &&
    item.examId !== input.examId
  ) {
    return false;
  }

  if (
    input.status &&
    item.status !== input.status
  ) {
    return false;
  }

  if (
    input.service &&
    filters.service !== input.service
  ) {
    return false;
  }

  if (
    input.domain &&
    filters.domain !== input.domain
  ) {
    return false;
  }

  if (
    input.concept &&
    filters.concept !== input.concept
  ) {
    return false;
  }

  if (
    input.selectCount !== undefined &&
    filters.selectCount !== input.selectCount
  ) {
    return false;
  }

  return true;
};

const toUserAttempt = (
  item: Record<string, any>
): UserAttempt => {
  const questionCount =
    item.questionCount ??
    item.questionIds?.length ??
    0;

  const totalQuestions =
    item.totalQuestions ?? questionCount;

  const correctCount =
    item.correctCount ?? null;

  const unansweredCount =
    item.unansweredCount ?? null;

  const incorrectCount =
    item.incorrectCount ??
    (
      correctCount !== null &&
      unansweredCount !== null
        ? totalQuestions -
          correctCount -
          unansweredCount
        : null
    );

  let durationSeconds: number | null =
    item.durationSeconds ?? null;

  if (
    durationSeconds === null &&
    item.startedAt &&
    item.completedAt
  ) {
    const startedAt =
      new Date(item.startedAt).getTime();

    const completedAt =
      new Date(item.completedAt).getTime();

    if (
      Number.isFinite(startedAt) &&
      Number.isFinite(completedAt)
    ) {
      durationSeconds = Math.max(
        0,
        Math.floor(
          (completedAt - startedAt) / 1000
        )
      );
    }
  }

  return {
    attemptId: item.attemptId,

    certificationId: item.certificationId,
    catalogVersion: item.catalogVersion ?? "1.0.0",

    mode: item.mode ?? "EXAM",
    examId: item.examId ?? null,

    filters: {
      ...(typeof item.filters?.examId === "string"
        ? { examId: item.filters.examId }
        : {}),

      ...(typeof item.filters?.service === "string"
        ? { service: item.filters.service }
        : {}),

      ...(typeof item.filters?.domain === "string"
        ? { domain: item.filters.domain }
        : {}),

      ...(typeof item.filters?.concept === "string"
        ? { concept: item.filters.concept }
        : {}),

      ...(typeof item.filters?.selectCount === "number"
        ? { selectCount: item.filters.selectCount }
        : {})
    },

    status: item.status,

    questionCount,
    totalQuestions,

    score: item.score ?? null,

    correctCount,
    incorrectCount,
    unansweredCount,

    startedAt: item.startedAt,
    completedAt: item.completedAt ?? null,

    durationSeconds
  };
};

export const getUserAttempts = async (
  input: GetUserAttemptsInput
): Promise<GetUserAttemptsResult> => {
  const limit = Math.min(
    Math.max(input.limit ?? 20, 1),
    100
  );

  let lastEvaluatedKey = decodeToken(
    input.nextToken,
    input.userId
  );

  const items: UserAttempt[] = [];

  // Bound the number of DynamoDB requests per invocation.
  const maxPages = 10;
  let pages = 0;

  do {
    const remaining = limit - items.length;

    const response = await documentClient.send(
      new QueryCommand({
        TableName: tableName,

        IndexName: "GSI1",

        KeyConditionExpression:
          "GSI1PK = :userId",

        ExpressionAttributeValues: {
          ":userId": `USER#${input.userId}`
        },

        ScanIndexForward: false,

        Limit: remaining,

        ...(lastEvaluatedKey
          ? {
              ExclusiveStartKey: lastEvaluatedKey
            }
          : {})
      })
    );

    for (const item of response.Items ?? []) {
      if (
        item.SK === "META" &&
        item.userId === input.userId &&
        matchesFilters(item, input)
      ) {
        items.push(
          toUserAttempt(item)
        );
      }
    }

    lastEvaluatedKey =
      response.LastEvaluatedKey;

    pages++;
  } while (
    lastEvaluatedKey &&
    items.length < limit &&
    pages < maxPages
  );

  return {
    items,
    nextToken: encodeToken(lastEvaluatedKey)
  };
};