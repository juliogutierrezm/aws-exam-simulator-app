import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { randomUUID } from "node:crypto";

import {
  createAttempt,
  type AttemptMode,
  type AttemptFilters
} from "../../../application/attempts/createAttempt.js";

import {
  selectAttemptQuestions,
  AttemptSelectionError
} from "../../../application/attempts/selectAttemptQuestions.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId =
      event.requestContext.authorizer.jwt.claims.sub;

    if (!userId || typeof userId !== "string") {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Unauthorized"
        })
      };
    }

    let body;

    try {
      body = event.body
        ? JSON.parse(event.body)
        : {};
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid JSON body"
        })
      };
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request body"
        })
      };
    }

    const mode: AttemptMode = body.mode ?? "EXAM";

    if (mode !== "EXAM" && mode !== "PRACTICE") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "mode must be EXAM or PRACTICE"
        })
      };
    }

    const certificationId = body.certificationId;

    if (
      typeof certificationId !== "string" ||
      !certificationId.trim()
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "certificationId is required"
        })
      };
    }

    const filters: AttemptFilters = {};

    let examId: string | null = null;
    let questionCount: number | undefined;

    if (mode === "EXAM") {
      if (
        typeof body.examId !== "string" ||
        !body.examId.trim()
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "examId is required for EXAM mode"
          })
        };
      }

      examId = body.examId.trim();
    }

    if (mode === "PRACTICE") {
      if (
        !Number.isInteger(body.questionCount) ||
        body.questionCount < 1 ||
        body.questionCount > 100
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "questionCount must be an integer between 1 and 100"
          })
        };
      }

      questionCount = body.questionCount;

      const rawFilters = body.filters ?? {};

      if (
        typeof rawFilters !== "object" ||
        Array.isArray(rawFilters)
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "filters must be an object"
          })
        };
      }

      const stringFilters = [
        "examId",
        "domain",
        "service",
        "concept"
      ] as const;

      for (const key of stringFilters) {
        const value = rawFilters[key];

        if (value !== undefined) {
          if (
            typeof value !== "string" ||
            !value.trim()
          ) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                message:
                  `Invalid filter: ${key}`
              })
            };
          }

          filters[key] = value.trim();
        }
      }

      if (rawFilters.selectCount !== undefined) {
        if (
          !Number.isInteger(rawFilters.selectCount) ||
          rawFilters.selectCount < 1
        ) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              message:
                "selectCount must be a positive integer"
            })
          };
        }

        filters.selectCount =
          rawFilters.selectCount;
      }

      examId = filters.examId ?? null;
    }

    const selection = await selectAttemptQuestions({
      mode,
      certificationId: certificationId.trim(),
      filters,

      ...(examId !== null
        ? { examId }
        : {}),

      ...(questionCount !== undefined
        ? { questionCount }
        : {})
    });

    const attemptId = randomUUID();
    const startedAt = new Date().toISOString();

    await createAttempt({
      attemptId,
      userId,

      certificationId: certificationId.trim(),
      catalogVersion: selection.catalogVersion,

      mode,
      examId,
      filters,

      questionIds: selection.questionIds,
      startedAt
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        attemptId,

        certificationId: certificationId.trim(),
        catalogVersion: selection.catalogVersion,

        mode,
        examId,
        filters,

        status: "IN_PROGRESS",
        startedAt,

        questionCount: selection.questionIds.length,
        questionIds: selection.questionIds
      })
    };
  } catch (error) {
    if (error instanceof AttemptSelectionError) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({
          message: error.message
        })
      };
    }

    console.error(
      "Error creating attempt",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to create attempt"
      })
    };
  }
};