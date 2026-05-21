# K3s Production Route

This is the recommended path for this project because it teaches real Kubernetes without needing EKS permissions.

## Why K3s

K3s is still Kubernetes. You will learn deployments, services, ingress, secrets, image pull policies, GitOps, metrics, logs, upgrades, and troubleshooting. The main difference is that the cluster is lighter and easier to operate on one VM or a small group of VMs.

## Recommended Lab Setup

Start with one Linux VM:

- Ubuntu 22.04 or 24.04
- 2 vCPU minimum, 4 vCPU preferred
- 4 GB RAM minimum, 8 GB preferred
- Open ports `22`, `80`, and `443`
- Optional DNS record pointing to the VM public IP

After you are comfortable, add more nodes:

- 1 server node
- 1 or 2 agent nodes

## 1. Install K3s

On the first VM:

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

K3s includes Traefik ingress by default, which is enough for this chatbot.

Copy kubeconfig to your workstation:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

Replace `127.0.0.1` in that file with your VM IP and save it locally as `~/.kube/k3s-chatbot.yaml`.

Use it:

```bash
export KUBECONFIG=~/.kube/k3s-chatbot.yaml
kubectl get nodes
```

## 2. Build And Push Images

Use GitHub Container Registry:

```bash
docker login ghcr.io
docker build -t ghcr.io/YOUR_GITHUB_OWNER/chatbot-backend:v1 backend
docker build -t ghcr.io/YOUR_GITHUB_OWNER/chatbot-frontend:v1 frontend
docker push ghcr.io/YOUR_GITHUB_OWNER/chatbot-backend:v1
docker push ghcr.io/YOUR_GITHUB_OWNER/chatbot-frontend:v1
```

Update `k8s/overlays/k3s/kustomization.yaml` with your real owner and tag.

For the easiest first deployment, make the GHCR packages public. If you keep them private, create an image pull secret and add it to the Kubernetes deployments.

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USER \
  --docker-password=YOUR_GITHUB_TOKEN \
  -n chatbot
```

## 3. Create The Gemini Secret

```bash
kubectl apply -f k8s/base/namespace.yaml
kubectl create secret generic chatbot-secrets \
  --from-literal=GEMINI_API_KEY="your-key" \
  -n chatbot
```

## 4. Deploy Manually First

```bash
kubectl apply -k k8s/overlays/k3s
kubectl get pods -n chatbot
kubectl get ingress -n chatbot
```

If you do not have DNS yet, add this on your workstation:

```text
YOUR_VM_IP chatbot.local
```

Then open:

```text
http://chatbot.local
```

## 5. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f argocd/application.yaml
```

After this, change image tags in Git and let ArgoCD sync them into K3s.

## 6. Add Monitoring And Logs

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  -f monitoring/prometheus-values.yaml \
  -n monitoring \
  --create-namespace

helm upgrade --install loki grafana/loki-stack \
  -f monitoring/loki-values.yaml \
  -n monitoring
```

## 7. CI/CD Path

The K3s route uses this deployment flow:

1. Push code to GitHub or GitLab.
2. CI runs backend tests and frontend build.
3. CI builds Docker images.
4. Trivy scans the repo and images.
5. CI pushes images to GHCR or GitLab Registry.
6. You update `k8s/overlays/k3s/kustomization.yaml` with the new image tag.
7. ArgoCD deploys the new version to K3s.

Later, you can automate step 6 with a GitOps update job.

## K3s vs kubeadm

Use K3s now. Move to kubeadm later only when you specifically want to learn cluster bootstrapping internals such as etcd, control-plane certificates, CNI installation, and manual upgrades. For CI/CD learning, K3s gives you the Kubernetes surface area you need with much less operational drag.
