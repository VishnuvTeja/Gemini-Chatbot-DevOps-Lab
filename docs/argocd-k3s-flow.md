# ArgoCD With K3s

This is the GitOps flow for the chatbot running on K3s inside your EC2 instance.

## Target Architecture

```text
Developer push
  -> GitHub CI
  -> Build backend and frontend Docker images
  -> Scan with Trivy
  -> Push images to GHCR
  -> Update image tag in k8s/overlays/k3s/kustomization.yaml
  -> ArgoCD syncs Git into K3s
  -> K3s pulls images from GHCR using ghcr-creds
```

## One-Time K3s Setup

Run on the EC2 instance:

```bash
sudo kubectl apply -f k8s/base/namespace.yaml

sudo kubectl create secret generic gemini-secret \
  --from-literal=GEMINI_API_KEY="your-key" \
  -n chatbot

sudo kubectl create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username="your-github-user" \
  --docker-password="your-github-token" \
  -n chatbot
```

## Install ArgoCD

```bash
sudo kubectl create namespace argocd
sudo kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
sudo kubectl apply -f argocd/application.yaml
```

Check it:

```bash
sudo kubectl get pods -n argocd
sudo kubectl get applications -n argocd
```

## Deploy Through ArgoCD

ArgoCD watches:

```text
k8s/overlays/k3s
```

The active image tags live in:

```text
k8s/overlays/k3s/kustomization.yaml
```

When CI creates a new image, change:

```yaml
newTag: v2
```

to the new tag, for example:

```yaml
newTag: v3
```

Commit and push. ArgoCD will sync the new deployment into K3s.

## Useful Commands

```bash
sudo kubectl get pods -n chatbot
sudo kubectl get svc -n chatbot
sudo kubectl describe pod -n chatbot -l app=chatbot-backend
sudo kubectl logs -n chatbot -l app=chatbot-backend
sudo kubectl logs -n chatbot -l app=chatbot-frontend
```

If ArgoCD does not sync immediately:

```bash
sudo kubectl annotate application chatbot -n argocd argocd.argoproj.io/refresh=hard --overwrite
```

## Important Notes

- ArgoCD does not build Docker images.
- CI/CD builds and pushes images.
- ArgoCD only deploys what Git says should run.
- `ghcr-creds` lets K3s pull private GHCR images.
- `gemini-secret` gives the backend the Gemini API key.
