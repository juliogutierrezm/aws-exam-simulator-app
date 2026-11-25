import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  getAttempt,
  getAttemptMetadata
} from "../../../application/attempts/getAttempt.js";

import {
  completeAttempt
} from "../../../application/attempts/completeAttempt.js";

import {
  getQuestionsByIds
} from "../../../application/content/getQuestionsByIds.js";

const normalizeAnswers = (
  answers: string[]
): string[] => {
  return [...new Set(answers)].sort();
};

const answersMatch = (
  selected: string[],
  correct: string[]
): boolean => {
  const normalizedSelected =
    normalizeAnswers(selected);

  const normalizedCorrect =
    normalizeAnswers(correct);

  if (
    normalizedSelected.length !==
    normalizedCorrect.length
  ) {
    return false;
  }

  return normalizedSelected.every(
    (answer, index) =>
      answer === normalizedCorrect[index]
  );
};

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const attemptId =
      event.pathParameters?.attemptId;

    const userId =
      event.requestContext.authorizer.jwt.claims.sub;

    if (!attemptId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "attemptId is required"
        })
      };
    }

    if (!userId || typeof userId !== "string") {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Unauthorized"
        })
      };
    }

    // Read metadata before reading answers
    const metadata =
      await getAttemptMetadata(attemptId);

    if (!metadata) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Attempt not found"
        })
      };
    }

    if (metadata.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden"
        })
      };
    }

    if (metadata.status !== "IN_PROGRESS") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Attempt is not in progress"
        })
      };
    }

    const expectedAnswerRevision: number =
      metadata.answerRevision ?? 0;

    const questionIds: string[] =
      metadata.questionIds ?? [];

    if (questionIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Attempt has no assigned questions"
        })
      };
    }

    if (
      new Set(questionIds).size !== questionIds.length
    ) {
      throw new Error(
        "Attempt contains duplicate question IDs"
      );
    }

    const catalogVersion =
      metadata.catalogVersion ?? "1.0.0";

    // Read answers after capturing answerRevision
    const items = await getAttempt(attemptId);

    const currentMetadata = items.find(
      (item) => item.SK === "META"
    );

    if (
      !currentMetadata ||
      currentMetadata.userId !== userId ||
      currentMetadata.status !== "IN_PROGRESS" ||
      (currentMetadata.answerRevision ?? 0) !==
        expectedAnswerRevision
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message:
            "Attempt changed during completion. Please retry."
        })
      };
    }

    const questions = await getQuestionsByIds({
      questionIds,
      catalogVersion
    });

    const userAnswers =
      new Map<string, string[]>();

    const assignedQuestions =
      new Set(questionIds);

    for (const item of items) {
      if (
        typeof item.SK === "string" &&
        item.SK.startsWith("ANSWER#")
      ) {
        const questionId =
          item.SK.substring("ANSWER#".length);

        if (assignedQuestions.has(questionId)) {
          userAnswers.set(
            questionId,
            item.selectedAnswers ?? []
          );
        }
      }
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    // Calculate result
    for (const question of questions) {
      const selectedAnswers =
        userAnswers.get(question.questionId) ?? [];

      if (selectedAnswers.length === 0) {
        unansweredCount++;
        continue;
      }

      if (
        answersMatch(
          selectedAnswers,
          question.correctAnswers
        )
      ) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    const totalQuestions = questionIds.length;

    const score = Number(
      (
        (correctCount / totalQuestions) * 100
      ).toFixed(2)
    );

    const completedAt =
      new Date().toISOString();

    const startedAtTimestamp =
      new Date(metadata.startedAt).getTime();

    const completedAtTimestamp =
      new Date(completedAt).getTime();

    if (!Number.isFinite(startedAtTimestamp)) {
      throw new Error(
        "Invalid attempt start date"
      );
    }

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (
          completedAtTimestamp -
          startedAtTimestamp
        ) / 1000
      )
    );

    // Persist result only if revision has not changed
    await completeAttempt({
      attemptId,
      userId,

      expectedAnswerRevision,

      score,

      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions,

      durationSeconds,
      completedAt
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        attemptId,

        certificationId: metadata.certificationId,
        catalogVersion,

        mode: metadata.mode ?? "EXAM",
        examId: metadata.examId ?? null,
        filters: metadata.filters ?? {},

        status: "COMPLETED",

        score,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions,

        startedAt: metadata.startedAt,
        completedAt,
        durationSeconds
      })
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.name ===
          "ConditionalCheckFailedException" ||
        error.name ===
          "TransactionConflictException"
      )
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message:
            "Attempt changed or was already completed. Please retry."
        })
      };
    }

    console.error(
      "Error completing attempt",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to complete attempt"
      })
    };
  }
};