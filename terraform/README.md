# Terraform

This creates:

- Two ECR repositories.
- A small public-subnet VPC.
- An EKS cluster.
- One managed node group.

```powershell
cd terraform
terraform init
terraform plan
terraform apply
```

After apply:

```powershell
aws eks update-kubeconfig --name chatbot-eks --region us-east-1
```

For production, add private subnets, NAT gateways, IAM OIDC, the AWS Load Balancer Controller, and remote state.
