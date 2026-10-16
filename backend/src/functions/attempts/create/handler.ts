import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { randomUUID } from "node:crypto";
import { createAttempt } from "../../../application/attempts/createAttempt.js";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const body = event.body ? JSON.parse(event.body) : {};

  const attemptId = randomUUID();
  const startedAt = new Date().toISOString();

  await createAttempt({
    attemptId,
    userId: body.userId,
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