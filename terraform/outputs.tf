output "backend_ecr_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "aws_region" {
  value = var.aws_region
}
