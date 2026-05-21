variable "aws_region" {
  description = "AWS region for ECR and EKS."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for cloud resources."
  type        = string
  default     = "chatbot"
}

variable "cluster_version" {
  description = "EKS Kubernetes version."
  type        = string
  default     = "1.31"
}
