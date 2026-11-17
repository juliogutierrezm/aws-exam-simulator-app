data "archive_file" "health_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/health/handler.js"
  output_path = "${path.module}/health-lambda.zip"
}

resource "aws_lambda_function" "health" {
  function_name = "${var.project_name}-${var.environment}-health"

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
  function_name = "${var.project_name}-${var.environment}-create-attempt"

  filename         = data.archive_file.create_attempt_lambda.output_path
  source_code_hash = data.archive_file.create_attempt_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.user_data.name
    }
  }
}

data "archive_file" "get_attempt_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/get/handler.js"
  output_path = "${path.module}/get-attempt-lambda.zip"
}

resource "aws_lambda_function" "get_attempt" {
  function_name = "${var.project_name}-${var.environment}-get-attempt"

  filename         = data.archive_file.get_attempt_lambda.output_path
  source_code_hash = data.archive_file.get_attempt_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.user_data.name
    }
  }
}

data "archive_file" "update_answer_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/updateAnswer/handler.js"
  output_path = "${path.module}/update-answer-lambda.zip"
}

resource "aws_lambda_function" "update_answer" {
  function_name = "${var.project_name}-${var.environment}-update-answer"

  filename         = data.archive_file.update_answer_lambda.output_path
  source_code_hash = data.archive_file.update_answer_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.user_data.name
    }
  }
}

data "archive_file" "complete_attempt_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/complete/handler.js"
  output_path = "${path.module}/complete-attempt-lambda.zip"
}

resource "aws_lambda_function" "complete_attempt" {
  function_name = "${var.project_name}-${var.environment}-complete-attempt"

  filename         = data.archive_file.complete_attempt_lambda.output_path
  source_code_hash = data.archive_file.complete_attempt_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.user_data.name
    }
  }
}

data "archive_file" "get_user_attempts_lambda" {
  type        = "zip"
  source_file = "../../../../backend/dist/attempts/getUserAttempts/handler.js"
  output_path = "${path.module}/get-user-attempts-lambda.zip"
}

resource "aws_lambda_function" "get_user_attempts" {
  function_name = "${var.project_name}-${var.environment}-get-user-attempts"

  filename         = data.archive_file.get_user_attempts_lambda.output_path
  source_code_hash = data.archive_file.get_user_attempts_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.user_data.name
    }
  }
}