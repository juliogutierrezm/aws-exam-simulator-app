import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getAttempt } from "../../../application/attempts/getAttempt.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const attemptId = event.pathParameters?.attemptId;
  const userId = event.requestContext.authorizer.jwt.claims.sub;

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

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  };
};