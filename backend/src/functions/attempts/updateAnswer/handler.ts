import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { updateAnswer } from "../../../application/attempts/updateAnswer.js";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const attemptId = event.pathParameters?.attemptId;
  const questionId = event.pathParameters?.questionId;

  if (!attemptId || !questionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "attemptId and questionId are required"
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