# K3s Manifests

This folder contains Kubernetes YAML for the K3s cluster running on the manually created EC2 instance.

K3s is Kubernetes, so the folder is still named `k8s`. The important part is that the only active overlay is:

```text
k8s/overlays/k3s
```

Current deployment shape:

- Namespace: `chatbot`
- Backend image: `ghcr.io/vishnuvteja/chatbot-backend:v2`
- Frontend image: `ghcr.io/vishnuvteja/chatbot-frontend:v2`
- Image pull secret: `ghcr-creds`
- Gemini API secret: `gemini-secret`
- Frontend exposure: K3s `LoadBalancer` service through ServiceLB
- GitOps path: ArgoCD watches `k8s/overlays/k3s`

Apply manually:

```bash
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -k k8s/overlays/k3s
```
