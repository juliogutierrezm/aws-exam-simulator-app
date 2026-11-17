resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.main.id

  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id = aws_apigatewayv2_api.main.id

  authorizer_type = "JWT"
  name            = "${var.project_name}-${var.environment}-cognito"

  identity_sources = [
    "$request.header.Authorization"
  ]

  jwt_configuration {
    audience = [
      aws_cognito_user_pool_client.web.id
    ]

    issuer = "https://${aws_cognito_user_pool.main.endpoint}"
  }
}

# ============================================================
# POST /attempts
# ============================================================

resource "aws_apigatewayv2_integration" "create_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.create_attempt.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /attempts"
  target    = "integrations/${aws_apigatewayv2_integration.create_attempt.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gateway_create_attempt" {
  statement_id  = "AllowApiGatewayCreateAttempt"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_attempt.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/POST/attempts"
}

# ============================================================
# GET /attempts/{attemptId}
# ============================================================

resource "aws_apigatewayv2_integration" "get_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_attempt.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "GET /attempts/{attemptId}"
  target    = "integrations/${aws_apigatewayv2_integration.get_attempt.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gateway_get_attempt" {
  statement_id  = "AllowApiGatewayGetAttempt"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_attempt.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/GET/attempts/*"
}

# ============================================================
# PUT /attempts/{attemptId}/answers/{questionId}
# ============================================================

resource "aws_apigatewayv2_integration" "update_answer" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.update_answer.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "update_answer" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "PUT /attempts/{attemptId}/answers/{questionId}"
  target    = "integrations/${aws_apigatewayv2_integration.update_answer.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gateway_update_answer" {
  statement_id  = "AllowApiGatewayUpdateAnswer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_answer.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/PUT/attempts/*/answers/*"
}

# ============================================================
# POST /attempts/{attemptId}/complete
# ============================================================

resource "aws_apigatewayv2_integration" "complete_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.complete_attempt.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "complete_attempt" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /attempts/{attemptId}/complete"
  target    = "integrations/${aws_apigatewayv2_integration.complete_attempt.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gateway_complete_attempt" {
  statement_id  = "AllowApiGatewayCompleteAttempt"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.complete_attempt.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/POST/attempts/*/complete"
}

# ============================================================
# GET /users/me/attempts
# ============================================================

resource "aws_apigatewayv2_integration" "get_user_attempts" {
  api_id = aws_apigatewayv2_api.main.id

  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.get_user_attempts.invoke_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_user_attempts" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "GET /users/me/attempts"
  target    = "integrations/${aws_apigatewayv2_integration.get_user_attempts.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_gateway_get_user_attempts" {
  statement_id  = "AllowApiGatewayGetUserAttempts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_attempts.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/GET/users/me/attempts"
}