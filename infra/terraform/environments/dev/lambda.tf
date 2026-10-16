data "archive_file" "health_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/health/handler.js"
  output_path = "${path.module}/health-lambda.zip"
}

resource "aws_lambda_function" "health" {
  function_name = "cloudcase-hub-dev-health"

  filename         = data.archive_file.health_lambda.output_path
  source_code_hash = data.archive_file.health_lambda.output_base64sha256

  role    = aws_iam_role.health_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"
}

data "archive_file" "create_attempt_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/create/handler.js"
  output_path = "${path.module}/create-attempt-lambda.zip"
}

resource "aws_lambda_function" "create_attempt" {
  function_name = "cloudcase-hub-dev-create-attempt"

  filename         = data.archive_file.create_attempt_lambda.output_path
  source_code_hash = data.archive_file.create_attempt_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"
}

data "archive_file" "get_attempt_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/get/handler.js"
  output_path = "${path.module}/get-attempt-lambda.zip"
}

resource "aws_lambda_function" "get_attempt" {
  function_name = "cloudcase-hub-dev-get-attempt"

  filename         = data.archive_file.get_attempt_lambda.output_path
  source_code_hash = data.archive_file.get_attempt_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"
}

data "archive_file" "update_answer_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/updateAnswer/handler.js"
  output_path = "${path.module}/update-answer-lambda.zip"
}

resource "aws_lambda_function" "update_answer" {
  function_name = "cloudcase-hub-dev-update-answer"

  filename         = data.archive_file.update_answer_lambda.output_path
  source_code_hash = data.archive_file.update_answer_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"
}