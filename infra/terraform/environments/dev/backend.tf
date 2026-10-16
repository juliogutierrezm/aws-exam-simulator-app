terraform {
  backend "s3" {
    bucket = "cloudcase-hub-terraform-state-670794226750"
    key    = "environments/dev/terraform.tfstate"
    region = "us-east-1"
  }
}