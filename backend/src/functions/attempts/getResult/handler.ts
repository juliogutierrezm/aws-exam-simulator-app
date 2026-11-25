import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";
import { getQuestionsByIds } from "../../../application/content/getQuestionsByIds.js";

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

    const items = await getAttempt(attemptId);

    const metadata = items.find(
      (item) => item.SK === "META"
    );

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

    if (metadata.status !== "COMPLETED") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Attempt is not completed"
        })
      };
    }

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

    const catalogVersion =
      metadata.catalogVersion ?? "1.0.0";

    const reviewData = await getQuestionsByIds({
      questionIds,
      catalogVersion
    });

    const userAnswers = new Map<string, string[]>();

    for (const item of items) {
      if (
        typeof item.SK === "string" &&
        item.SK.startsWith("ANSWER#")
      ) {
        const questionId =
          item.SK.substring("ANSWER#".length);

        userAnswers.set(
          questionId,
          item.selectedAnswers ?? []
        );
      }
    }

    const questions = reviewData.map((item) => {
      const selectedAnswers =
        userAnswers.get(item.questionId) ?? [];

      const isAnswered =
        selectedAnswers.length > 0;

      const isCorrect =
        isAnswered &&
        answersMatch(
          selectedAnswers,
          item.correctAnswers
        );

      return {
        questionId: item.questionId,
        examId: item.examId,
        certificationId: item.certificationId,
        catalogVersion: item.catalogVersion,
        examDomain: item.examDomain,
        selectCount: item.selectCount,

        question: item.question,

        selectedAnswers,
        correctAnswers: item.correctAnswers,

        isAnswered,
        isCorrect,

        feedback: item.feedback,
        metadata: item.metadata
      };
    });

    const correctCount = questions.filter(
      (question) => question.isCorrect
    ).length;

    const incorrectCount = questions.filter(
      (question) =>
        question.isAnswered &&
        !question.isCorrect
    ).length;

    const unansweredCount = questions.filter(
      (question) => !question.isAnswered
    ).length;

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (
          new Date(metadata.completedAt).getTime() -
          new Date(metadata.startedAt).getTime()
        ) / 1000
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        attemptId: metadata.attemptId,
        examId: metadata.examId ?? null,
        certificationId: metadata.certificationId,
        catalogVersion,

        mode: metadata.mode ?? "EXAM",
        filters: metadata.filters ?? {},

        status: metadata.status,
        score: metadata.score,

        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions: questionIds.length,

        startedAt: metadata.startedAt,
        completedAt: metadata.completedAt,
        durationSeconds,

        questions
      })
    };
  } catch (error) {
    console.error(
      "Error retrieving attempt result",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to retrieve attempt result"
      })
    };
  }
};