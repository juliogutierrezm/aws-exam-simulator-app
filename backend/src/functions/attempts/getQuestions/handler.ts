import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  getAttemptMetadata
} from "../../../application/attempts/getAttempt.js";

import {
  getPublicQuestionsByIds
} from "../../../application/content/getPublicQuestionsByIds.js";

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

    const questionIds: string[] =
      metadata.questionIds ?? [];

    if (questionIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Attempt has no assigned questions"
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

    const questions =
      await getPublicQuestionsByIds({
        questionIds,
        catalogVersion
      });

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },

      body: JSON.stringify({
        attemptId,

        certificationId:
          metadata.certificationId,

        catalogVersion,

        mode: metadata.mode ?? "EXAM",
        examId: metadata.examId ?? null,
        filters: metadata.filters ?? {},

        status: metadata.status,

        questionCount: questions.length,
        questions
      })
    };
  } catch (error) {
    console.error(
      "Error retrieving attempt questions",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Unable to retrieve attempt questions"
      })
    };
  }
};