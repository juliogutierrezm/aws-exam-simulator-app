import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";
import { updateAnswer } from "../../../application/attempts/updateAnswer.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const attemptId = event.pathParameters?.attemptId;
  const questionId = event.pathParameters?.questionId;
  const userId = event.requestContext.authorizer.jwt.claims.sub;

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

  const items = await getAttempt(attemptId);

  if (items.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Attempt not found"
      })
    };
  }

  const metadata = items.find((item) => item.SK === "META");

  if (!metadata || metadata.userId !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden"
      })
    };
  }

  const body = event.body ? JSON.parse(event.body) : {};

  await updateAnswer({
    attemptId,
    questionId,
    selectedAnswers: body.selectedAnswers ?? [],
    markedForReview: body.markedForReview ?? false,
    updatedAt: new Date().toISOString()
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Answer updated"
    })
  };
};