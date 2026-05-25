# CI/CD Learning Path

Use this project in stages. Do not jump straight to cloud Kubernetes; the learning is much better when each step works before the next one. The main route is now K3s.

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

## 5. K3s Cluster

Goal: create a real Kubernetes cluster without AWS permissions.

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

For the full setup, use `docs/k3s-production-route.md`.

## 6. Push Images To A Registry

Goal: store deployable images in GHCR.

```powershell
docker login ghcr.io
docker tag chatbot-backend:local ghcr.io/vishnuvteja/chatbot-backend:v2
docker tag chatbot-frontend:local ghcr.io/vishnuvteja/chatbot-frontend:v2
docker push ghcr.io/vishnuvteja/chatbot-backend:v2
docker push ghcr.io/vishnuvteja/chatbot-frontend:v2
```

Update `k8s/overlays/k3s/kustomization.yaml` when the image tag changes.

## 7. Kubernetes Deploy

Goal: run manually before adding GitOps.

```powershell
kubectl apply -f k8s/base/namespace.yaml
kubectl create secret generic gemini-secret --from-literal=GEMINI_API_KEY="your-key" -n chatbot --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret docker-registry ghcr-creds --docker-server=ghcr.io --docker-username="your-user" --docker-password="your-token" -n chatbot --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k k8s/overlays/k3s
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

- Push to `main`.
- The workflow tests, builds, scans, and pushes images to GHCR.
