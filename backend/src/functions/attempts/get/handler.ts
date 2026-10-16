import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const attemptId = event.pathParameters?.attemptId;

  if (!attemptId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "attemptId is required"
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

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  };
};