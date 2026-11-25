import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  getUserAttempts,
  InvalidAttemptTokenError,
  type GetUserAttemptsInput
} from "../../../application/attempts/getUserAttempts.js";

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

    const input: GetUserAttemptsInput = {
      userId,
      limit: 20
    };

    const stringFilters = [
      "certificationId",
      "examId",
      "service",
      "domain",
      "concept"
    ] as const;

    for (const key of stringFilters) {
      const value = params[key];

      if (value !== undefined) {
        if (!value.trim()) {
          return jsonResponse(400, {
            message: `Invalid filter: ${key}`
          });
        }

        input[key] = value.trim();
      }
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

    if (params.status !== undefined) {
      if (
        params.status !== "IN_PROGRESS" &&
        params.status !== "COMPLETED"
      ) {
        return jsonResponse(400, {
          message:
            "status must be IN_PROGRESS or COMPLETED"
        });
      }

      input.status = params.status;
    }

    if (params.selectCount !== undefined) {
      const selectCount =
        Number(params.selectCount);

      if (
        !/^\d+$/.test(params.selectCount) ||
        !Number.isSafeInteger(selectCount) ||
        selectCount < 1
      ) {
        return jsonResponse(400, {
          message:
            "selectCount must be a positive integer"
        });
      }

      input.selectCount = selectCount;
    }

    if (params.limit !== undefined) {
      const limit = Number(params.limit);

      if (
        !/^\d+$/.test(params.limit) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return jsonResponse(400, {
          message:
            "limit must be an integer between 1 and 100"
        });
      }

      input.limit = limit;
    }

    if (params.nextToken !== undefined) {
      if (
        !params.nextToken.trim() ||
        params.nextToken.length > 4096
      ) {
        return jsonResponse(400, {
          message: "Invalid pagination token"
        });
      }

      input.nextToken = params.nextToken;
    }

    const result = await getUserAttempts(input);

    return jsonResponse(200, {
      items: result.items,
      count: result.items.length,
      nextToken: result.nextToken
    });
  } catch (error) {
    if (error instanceof InvalidAttemptTokenError) {
      return jsonResponse(400, {
        message: error.message
      });
    }

    console.error(
      "Error retrieving user attempts",
      error
    );

    return jsonResponse(500, {
      message: "Unable to retrieve user attempts"
    });
  }
};