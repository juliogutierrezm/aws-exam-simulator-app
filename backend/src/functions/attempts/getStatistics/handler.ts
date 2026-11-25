import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  getUserStatistics,
  type GetUserStatisticsInput
} from "../../../application/attempts/getUserStatistics.js";

const jsonResponse = (
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResultV2 => ({
  statusCode,

  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  },

  body: JSON.stringify(body)
});

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId =
      event.requestContext.authorizer.jwt.claims.sub;

    if (!userId || typeof userId !== "string") {
      return jsonResponse(401, {
        message: "Unauthorized"
      });
    }

    const params =
      event.queryStringParameters ?? {};

    const input: GetUserStatisticsInput = {
      userId
    };

    if (params.certificationId !== undefined) {
      if (!params.certificationId.trim()) {
        return jsonResponse(400, {
          message: "Invalid certificationId"
        });
      }

      input.certificationId =
        params.certificationId.trim();
    }

    if (params.mode !== undefined) {
      if (
        params.mode !== "EXAM" &&
        params.mode !== "PRACTICE"
      ) {
        return jsonResponse(400, {
          message:
            "mode must be EXAM or PRACTICE"
        });
      }

      input.mode = params.mode;
    }

    const statistics =
      await getUserStatistics(input);

    return jsonResponse(
      200,
      statistics
    );

  } catch (error) {
    console.error(
      "Error retrieving user statistics",
      error
    );

    return jsonResponse(500, {
      message:
        "Unable to retrieve user statistics"
    });
  }
};