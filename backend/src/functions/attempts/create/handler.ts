import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { randomUUID } from "node:crypto";
import { createAttempt } from "../../../application/attempts/createAttempt.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const body = event.body ? JSON.parse(event.body) : {};

  const userId = event.requestContext.authorizer.jwt.claims.sub;

  if (!userId || typeof userId !== "string") {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized"
      })
    };
  }

  const attemptId = randomUUID();
  const startedAt = new Date().toISOString();

  await createAttempt({
    attemptId,
    userId,
    examId: body.examId,
    certificationId: body.certificationId,
    startedAt
  });

  return {
    statusCode: 201,
    body: JSON.stringify({
      attemptId,
      status: "IN_PROGRESS",
      startedAt
    })
  };
};