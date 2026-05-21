# CI/CD Learning Path

Use this project in stages. Do not jump straight to EKS; the learning is much better when each step works before the next one.

## 1. Local App

Goal: prove React, FastAPI, and Gemini work together.

```powershell
docker compose up --build
```

Check:

- Frontend opens at `http://localhost:5173`.
- Backend health returns `http://localhost:8000/health`.
- Chatbot responds using your `.env` `GEMINI_API_KEY`.

## 2. Local Tests

Goal: understand what CI will run.

```powershell
cd backend
pip install -r requirements.txt
$env:GEMINI_API_KEY="test-key"
pytest
```

```powershell
cd frontend
npm install
npm run build
```

## 3. Container Images

Goal: package each service the same way CI will.

```powershell
docker build -t chatbot-backend:local backend
docker build -t chatbot-frontend:local frontend
```

## 4. Security Scan

Goal: catch vulnerable dependencies and images before deployment.

```powershell
trivy fs .
trivy image chatbot-backend:local
trivy image chatbot-frontend:local
```

## 5. AWS Infrastructure

Goal: create ECR and EKS.

```powershell
cd terraform
terraform init
terraform plan
terraform apply
```

Then configure kubectl:

```powershell
aws eks update-kubeconfig --name chatbot-eks --region us-east-1
```

## 6. Push Images To ECR

Goal: store deployable images in AWS.

```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag chatbot-backend:local ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatbot-backend:v1
docker tag chatbot-frontend:local ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatbot-frontend:v1
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatbot-backend:v1
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatbot-frontend:v1
```

Update `k8s/overlays/prod/kustomization.yaml` with the real account ID and tag.

## 7. Kubernetes Deploy

Goal: run manually before adding GitOps.

```powershell
kubectl create secret generic chatbot-secrets --from-literal=GEMINI_API_KEY="your-key" -n chatbot --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k k8s/overlays/prod
kubectl get pods -n chatbot
```

## 8. ArgoCD

Goal: let Git be the deployment source of truth.

```powershell
kubectl apply -f argocd/application.yaml
```

After this, a Git commit changing image tags becomes a deployment.

## 9. Monitoring And Logs

Goal: see app health after deployment.

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -f monitoring/prometheus-values.yaml -n monitoring --create-namespace
helm upgrade --install loki grafana/loki-stack -f monitoring/loki-values.yaml -n monitoring
```

Prometheus scrapes backend metrics from `/metrics`.

## 10. CI/CD

Goal: automate the same path.

For GitHub:

- Set `AWS_ROLE_TO_ASSUME` as a GitHub secret.
- Push to `main`.
- The workflow tests, builds, scans, and pushes images.

For GitLab:

- Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_ACCOUNT_ID` as CI/CD variables.
- Push to `main`.
- The pipeline tests, builds, scans, and pushes images.
