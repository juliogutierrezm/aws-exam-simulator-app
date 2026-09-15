import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { handler } from "./handler.js";

const event: APIGatewayProxyEventV2 = {
  version: "2.0",
  routeKey: "GET /health",
  rawPath: "/health",
  rawQueryString: "",
  headers: {
    "content-type": "application/json"
  },
  isBase64Encoded: false,
  requestContext: {
    accountId: "123456789012",
    apiId: "local-api",
    domainName: "localhost",
    domainPrefix: "local",
    http: {
      method: "GET",
      path: "/health",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "local-test"
    },
    requestId: "local-request-id",
    routeKey: "GET /health",
    stage: "$default",
    time: "14/Sep/2026:17:28:00 -0600",
    timeEpoch: 0
  }
};

const result = await handler(event);
console.log(result);