import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { getUserAttempts } from "../../../application/attempts/getUserAttempts.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;

  if (!userId || typeof userId !== "string") {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized"
      })
    };
  }

  const attempts = await getUserAttempts(userId);

  return {
    statusCode: 200,
    body: JSON.stringify(attempts)
  };
};