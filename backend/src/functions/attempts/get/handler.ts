import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const attemptId = event.pathParameters?.attemptId;

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

    const questionIds: string[] =
      metadata.questionIds ?? [];

    const assignedQuestions = new Set(questionIds);

    const answers = items
      .filter(
        (item) =>
          typeof item.SK === "string" &&
          item.SK.startsWith("ANSWER#") &&
          assignedQuestions.has(
            item.SK.substring("ANSWER#".length)
          )
      )
      .map((item) => ({
        questionId:
          item.SK.substring("ANSWER#".length),

        selectedAnswers:
          item.selectedAnswers ?? [],

        markedForReview:
          item.markedForReview ?? false,

        updatedAt:
          item.updatedAt ?? null
      }));

    const answeredCount = answers.filter(
      (answer) => answer.selectedAnswers.length > 0
    ).length;

    const markedForReviewCount = answers.filter(
      (answer) => answer.markedForReview
    ).length;

    const questionCount = questionIds.length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        attemptId: metadata.attemptId,

        certificationId: metadata.certificationId,
        catalogVersion: metadata.catalogVersion ?? "1.0.0",

        mode: metadata.mode ?? "EXAM",
        examId: metadata.examId ?? null,
        filters: metadata.filters ?? {},

        status: metadata.status,

        startedAt: metadata.startedAt,
        completedAt: metadata.completedAt ?? null,

        score: metadata.score ?? null,
        correctCount: metadata.correctCount ?? null,
        incorrectCount: metadata.incorrectCount ?? null,

        totalQuestions: questionCount,
        questionCount,
        answeredCount,

        unansweredCount:
          questionCount - answeredCount,

        markedForReviewCount,

        questionIds,
        answers
      })
    };
  } catch (error) {
    console.error(
      "Error retrieving attempt",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to retrieve attempt"
      })
    };
  }
};