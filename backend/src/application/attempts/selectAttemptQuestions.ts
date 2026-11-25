import { randomInt } from "node:crypto";

import {
  queryQuestions,
  type QueryQuestionsInput
} from "../content/queryQuestions.js";

import type {
  AttemptMode,
  AttemptFilters
} from "./createAttempt.js";

type SelectAttemptQuestionsInput = {
  mode: AttemptMode;
  certificationId: string;
  examId?: string;
  questionCount?: number;
  filters: AttemptFilters;
};

type SelectAttemptQuestionsResult = {
  questionIds: string[];
  catalogVersion: string;
};

export class AttemptSelectionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AttemptSelectionError";
  }
}

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);

    const current = result[i]!;
    result[i] = result[j]!;
    result[j] = current;
  }

  return result;
};

export const selectAttemptQuestions = async (
  input: SelectAttemptQuestionsInput
): Promise<SelectAttemptQuestionsResult> => {
  const query: QueryQuestionsInput = {
    certificationId: input.certificationId,
    limit: 100
  };

  if (input.mode === "EXAM") {
    if (!input.examId) {
      throw new AttemptSelectionError(
        "examId is required for EXAM mode"
      );
    }

    query.examId = input.examId;
  }

  if (input.mode === "PRACTICE") {
    if (
      input.questionCount === undefined ||
      !Number.isInteger(input.questionCount) ||
      input.questionCount < 1 ||
      input.questionCount > 100
    ) {
      throw new AttemptSelectionError(
        "questionCount must be an integer between 1 and 100"
      );
    }

    if (input.filters.examId) {
      query.examId = input.filters.examId;
    }

    if (input.filters.domain) {
      query.domain = input.filters.domain;
    }

    if (input.filters.service) {
      query.service = input.filters.service;
    }

    if (input.filters.concept) {
      query.concept = input.filters.concept;
    }

    if (input.filters.selectCount !== undefined) {
      query.selectCount = input.filters.selectCount;
    }
  }

  const candidates: Array<{
    questionId: string;
    catalogVersion: string;
    bankIndex: number;
  }> = [];

  let nextToken: string | null = null;

  do {
    if (nextToken) {
      query.nextToken = nextToken;
    }

    const response = await queryQuestions(query);

    for (const question of response.items) {
      candidates.push({
        questionId: question.questionId,
        catalogVersion: question.catalogVersion,
        bankIndex: question.bankIndex
      });
    }

    nextToken = response.nextToken;
  } while (nextToken);

  if (candidates.length === 0) {
    throw new AttemptSelectionError(
      "No questions match the selected criteria",
      404
    );
  }

  const catalogVersions = [
    ...new Set(
      candidates.map(
        (question) => question.catalogVersion
      )
    )
  ];

  const catalogVersion = catalogVersions[0];

  if (
    catalogVersions.length !== 1 ||
    !catalogVersion
  ) {
    throw new AttemptSelectionError(
      "Unable to determine catalog version",
      500
    );
  }

  const uniqueCandidates = [
    ...new Map(
      candidates.map((question) => [
        question.questionId,
        question
      ])
    ).values()
  ];

  let questionIds: string[];

  if (input.mode === "EXAM") {
    questionIds = uniqueCandidates
      .sort((a, b) => a.bankIndex - b.bankIndex)
      .map((question) => question.questionId);
  } else {
    const requestedCount = input.questionCount!;

    if (uniqueCandidates.length < requestedCount) {
      throw new AttemptSelectionError(
        `Only ${uniqueCandidates.length} questions match the selected criteria`
      );
    }

    questionIds = shuffle(uniqueCandidates)
      .slice(0, requestedCount)
      .map((question) => question.questionId);
  }

  return {
    questionIds,
    catalogVersion
  };
};