resource "aws_iam_role" "attempts_lambda" {
  name = "${var.project_name}-${var.environment}-attempts-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attempts_lambda_basic_execution" {
  role       = aws_iam_role.attempts_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "attempts_dynamodb" {
  name = "${var.project_name}-${var.environment}-attempts-dynamodb"
  role = aws_iam_role.attempts_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]

        Resource = [
          aws_dynamodb_table.user_data.arn,
          "${aws_dynamodb_table.user_data.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "attempts_content_read" {
  name = "${var.project_name}-${var.environment}-attempts-content-read"
  role = aws_iam_role.attempts_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem"
        ]

        Resource = [
          aws_dynamodb_table.content.arn,
          "${aws_dynamodb_table.content.arn}/index/*"
        ]
      }
    ]
  })
}