import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  queryQuestions,
  type QueryQuestionsInput
} from "../../../application/content/queryQuestions.js";

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  try {
    const params = event.queryStringParameters ?? {};

    const input: QueryQuestionsInput = {};

    if (params.examId) {
      input.examId = params.examId;
    }

    if (params.certificationId) {
      input.certificationId = params.certificationId;
    }

    if (params.domain) {
      input.domain = params.domain;
    }

    if (params.service) {
      input.service = params.service;
    }

    if (params.concept) {
      input.concept = params.concept;
    }

    if (params.nextToken) {
      input.nextToken = params.nextToken;
    }
    
    if (params.selectCount) {
      const selectCount = Number(params.selectCount);

      if (
        !Number.isInteger(selectCount) ||
        selectCount < 1
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "selectCount must be a positive integer"
          })
        };
      }

      input.selectCount = selectCount;
    }

    if (params.limit) {
      const limit = Number(params.limit);

      if (
        !Number.isInteger(limit) ||
        limit < 1
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "limit must be a positive integer"
          })
        };
      }

      input.limit = limit;
    }

    const result = await queryQuestions(input);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error(
      "Error querying questions",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          "Unable to retrieve questions"
      })
    };
  }
};