# ============================================================
# Lambda paths
# ============================================================

locals {
  lambda_source_path    = "${path.module}/../../../../backend/dist"
  lambda_artifacts_path = "${path.module}/../../artifacts/${var.environment}"
}

# ============================================================
# Health
# ============================================================

data "archive_file" "health_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/health/handler.js"
  output_path = "${local.lambda_artifacts_path}/health-lambda.zip"
}

resource "aws_lambda_function" "health" {
  function_name = "${var.project_name}-${var.environment}-health"

  filename         = data.archive_file.health_lambda.output_path
  source_code_hash = data.archive_file.health_lambda.output_base64sha256

  role    = aws_iam_role.health_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"
}

# ============================================================
# Create attempt
# ============================================================

data "archive_file" "create_attempt_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/create/handler.js"
  output_path = "${local.lambda_artifacts_path}/create-attempt-lambda.zip"
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
      TABLE_NAME         = aws_dynamodb_table.user_data.name
      CONTENT_TABLE_NAME = aws_dynamodb_table.content.name
    }
  }
}

# ============================================================
# Get attempt
# ============================================================

data "archive_file" "get_attempt_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/get/handler.js"
  output_path = "${local.lambda_artifacts_path}/get-attempt-lambda.zip"
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

# ============================================================
# Update answer
# ============================================================

data "archive_file" "update_answer_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/updateAnswer/handler.js"
  output_path = "${local.lambda_artifacts_path}/update-answer-lambda.zip"
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

# ============================================================
# Complete attempt
# ============================================================

data "archive_file" "complete_attempt_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/complete/handler.js"
  output_path = "${local.lambda_artifacts_path}/complete-attempt-lambda.zip"
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
      TABLE_NAME         = aws_dynamodb_table.user_data.name
      CONTENT_TABLE_NAME = aws_dynamodb_table.content.name
    }
  }
}

# ============================================================
# Get user attempts
# ============================================================

data "archive_file" "get_user_attempts_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/getUserAttempts/handler.js"
  output_path = "${local.lambda_artifacts_path}/get-user-attempts-lambda.zip"
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

# ============================================================
# Query questions
# ============================================================

data "archive_file" "query_questions_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/content/queryQuestions/handler.js"
  output_path = "${local.lambda_artifacts_path}/query-questions-lambda.zip"
}

resource "aws_lambda_function" "query_questions" {
  function_name = "${var.project_name}-${var.environment}-query-questions"

  filename         = data.archive_file.query_questions_lambda.output_path
  source_code_hash = data.archive_file.query_questions_lambda.output_base64sha256

  role    = aws_iam_role.content_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      CONTENT_TABLE_NAME = aws_dynamodb_table.content.name
    }
  }
}

# ============================================================
# Get result
# ============================================================

data "archive_file" "get_result_lambda" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/attempts/getResult/handler.js"
  output_path = "${local.lambda_artifacts_path}/get-result-lambda.zip"
}

resource "aws_lambda_function" "get_result" {
  function_name = "${var.project_name}-${var.environment}-get-result"

  filename         = data.archive_file.get_result_lambda.output_path
  source_code_hash = data.archive_file.get_result_lambda.output_base64sha256

  role    = aws_iam_role.attempts_lambda.arn
  handler = "handler.handler"
  runtime = "nodejs24.x"

  environment {
    variables = {
      TABLE_NAME         = aws_dynamodb_table.user_data.name
      CONTENT_TABLE_NAME = aws_dynamodb_table.content.name
    }
  }
}