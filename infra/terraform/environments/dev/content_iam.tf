resource "aws_iam_role" "content_lambda" {
  name = "${var.project_name}-${var.environment}-content-lambda-role"

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

resource "aws_iam_role_policy_attachment" "content_lambda_basic_execution" {
  role       = aws_iam_role.content_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "content_dynamodb" {
  name = "${var.project_name}-${var.environment}-content-dynamodb"
  role = aws_iam_role.content_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]

        Resource = [
          aws_dynamodb_table.content.arn,
          "${aws_dynamodb_table.content.arn}/index/*"
        ]
      }
    ]
  })
}