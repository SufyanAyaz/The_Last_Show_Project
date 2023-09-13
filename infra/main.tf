terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ca-central-1"
}

resource "aws_s3_bucket" "lambda" {
  bucket = "thelastshow-st"
}

output "bucket_name" {
  value = aws_s3_bucket.lambda.bucket
}

locals {
  create_function_name = "create-obituaries-30145085"
  create_handler_name  = "main.lambda_handler"
  create_artifact_name = "createartifact.zip"
  get_function_name    = "get-obituaries-30145085"
  get_handler_name     = "main.lambda_handler"
  get_artifact_name    = "getartifact.zip"
}

resource "aws_iam_role" "create_lambda" {
  name               = "iam-for-lambda-${local.create_function_name}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "get_lambda" {
  name               = "iam-for-lambda-${local.get_function_name}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

data "archive_file" "create_lambda" {
  type        = "zip"
  source_dir  = "../functions/create-obituary"
  output_path = local.create_artifact_name
}

data "archive_file" "get_lambda" {
  type        = "zip"
  source_file = "../functions/get-obituaries/main.py"
  output_path = local.get_artifact_name
}

resource "aws_lambda_function" "create_lambda" {
  role             = aws_iam_role.create_lambda.arn
  function_name    = local.create_function_name
  handler          = local.create_handler_name
  filename         = local.create_artifact_name
  timeout          = 20
  source_code_hash = data.archive_file.create_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_lambda_function" "get_lambda" {
  role             = aws_iam_role.get_lambda.arn
  function_name    = local.get_function_name
  handler          = local.get_handler_name
  filename         = local.get_artifact_name
  source_code_hash = data.archive_file.get_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_iam_policy" "create_logs" {
  name        = "lambda-logging-${local.create_function_name}"
  description = "IAM policy for logging from a lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3:*",
          "dynamodb:PutItem",
          "ssm:GetParametersByPath",
          "polly:SynthesizeSpeech"
        ]
        Resource = [
          "arn:aws:logs:*:*:*",
          "*",
          "${aws_dynamodb_table.thelastshow-30142184.arn}",
          "arn:aws:ssm:ca-central-1:660514643287:parameter/the-last-show/cloudinaryapikey",
          "arn:aws:ssm:ca-central-1:660514643287:parameter/the-last-show/cloudinarysecret",
          "arn:aws:polly:*:*:*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetParametersByPath"
        Resource = "arn:aws:ssm:ca-central-1:660514643287:parameter/the-last-show/cloudinaryapikey"
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetParametersByPath"
        Resource = "arn:aws:ssm:ca-central-1:660514643287:parameter/the-last-show/cloudinarysecret"
      }
    ]
  })
}



resource "aws_iam_policy" "get_logs" {
  name        = "lambda-logging-${local.get_function_name}"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:Scan"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.thelastshow-30142184.arn}"],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "create_lambda_logs" {
  role       = aws_iam_role.create_lambda.name
  policy_arn = aws_iam_policy.create_logs.arn
}

resource "aws_iam_role_policy_attachment" "get_lambda_logs" {
  role       = aws_iam_role.get_lambda.name
  policy_arn = aws_iam_policy.get_logs.arn
}

resource "aws_lambda_function_url" "create_url" {
  function_name      = aws_lambda_function.create_lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

resource "aws_lambda_function_url" "get_url" {
  function_name      = aws_lambda_function.get_lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "create_lambda_url" {
  value = aws_lambda_function_url.create_url.function_url
}

output "get_lambda_url" {
  value = aws_lambda_function_url.get_url.function_url
}

resource "aws_dynamodb_table" "thelastshow-30142184" {
  name         = "thelastshow-30142184"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  hash_key  = "Name"
  range_key = "uuid"

  attribute {
    name = "Name"
    type = "S"
  }

  attribute {
    name = "uuid"
    type = "S"
  }
}
