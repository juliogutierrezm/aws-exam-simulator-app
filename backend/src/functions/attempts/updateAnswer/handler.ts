import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";
import { updateAnswer } from "../../../application/attempts/updateAnswer.js";
import { getQuestionsByIds } from "../../../application/content/getQuestionsByIds.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const attemptId =
      event.pathParameters?.attemptId;

    const questionId =
      event.pathParameters?.questionId;

    const userId =
      event.requestContext.authorizer.jwt.claims.sub;

    if (!attemptId || !questionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "attemptId and questionId are required"
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

    let body;

    try {
      body = event.body
        ? JSON.parse(event.body)
        : {};
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid JSON body"
        })
      };
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request body"
        })
      };
    }

    const selectedAnswers =
      body.selectedAnswers ?? [];

    const markedForReview =
      body.markedForReview ?? false;

    if (
      !Array.isArray(selectedAnswers) ||
      !selectedAnswers.every(
        (answer: unknown) =>
          typeof answer === "string" &&
          answer.trim().length > 0
      )
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "selectedAnswers must be an array of strings"
        })
      };
    }

    if (typeof markedForReview !== "boolean") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "markedForReview must be a boolean"
        })
      };
    }

    const uniqueAnswers: string[] = [
      ...new Set<string>(selectedAnswers)
    ];

    if (
      uniqueAnswers.length !== selectedAnswers.length
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Duplicate answers are not allowed"
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

    if (metadata.status !== "IN_PROGRESS") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Attempt is not in progress"
        })
      };
    }

    const questionIds: string[] =
      metadata.questionIds ?? [];

    if (!questionIds.includes(questionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Question is not assigned to this attempt"
        })
      };
    }

    const catalogVersion =
      metadata.catalogVersion ?? "1.0.0";

    const questions = await getQuestionsByIds({
      questionIds: [questionId],
      catalogVersion
    });

    const question = questions[0];

    if (!question) {
      throw new Error(
        "Assigned question not found in catalog"
      );
    }

    const validOptionIds = new Set(
      question.question.options.map(
        (option) => option.id
      )
    );

    const hasInvalidAnswers = uniqueAnswers.some(
      (answer) => !validOptionIds.has(answer)
    );

    if (hasInvalidAnswers) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid answer option"
        })
      };
    }

    if (uniqueAnswers.length > question.selectCount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            `A maximum of ${question.selectCount} answers is allowed`
        })
      };
    }

    const updatedAt = new Date().toISOString();

    await updateAnswer({
      attemptId,
      userId,
      questionId,
      selectedAnswers: uniqueAnswers,
      markedForReview,
      updatedAt
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Answer updated",
        questionId,
        selectedAnswers: uniqueAnswers,
        markedForReview,
        updatedAt
      })
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "TransactionCanceledException"
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message:
            "Unable to update answer because the attempt state changed or a concurrent operation occurred"
        })
      };
    }

    console.error(
      "Error updating answer",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to update answer"
      })
    };
  }
};