#!/bin/bash
# k3d cluster setup for local development
# Prerequisites: Docker Desktop, k3d (https://k3d.io), kubectl

set -euo pipefail

CLUSTER_NAME="blog-dev"

echo "=== Creating k3d cluster: $CLUSTER_NAME ==="

# Delete existing cluster if it exists
k3d cluster delete $CLUSTER_NAME 2>/dev/null || true

# Create cluster with 1 server + 2 agents, nginx ingress ports mapped
k3d cluster create $CLUSTER_NAME \
  --servers 1 \
  --agents 2 \
  --port "5173:80@loadbalancer" \
  --port "9090:9090@loadbalancer" \
  --port "3001:3000@loadbalancer" \
  --k3s-arg "--disable=traefik@server:0" \
  --wait

echo "=== Cluster created. Installing nginx-ingress ==="

# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
echo "Waiting for ingress-nginx to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "=== Creating namespaces ==="
kubectl apply -f k8s/base/namespace.yaml

echo "=== Creating secrets (update values in k8s/base/secrets.yaml first!) ==="
kubectl apply -f k8s/base/secrets.yaml

echo ""
echo "=== k3d cluster '$CLUSTER_NAME' is ready! ==="
echo ""
echo "Next steps:"
echo "  1. Create GitLab registry pull secret:"
echo "     kubectl create secret docker-registry gitlab-registry \\"
echo "       --namespace blog-app \\"
echo "       --docker-server=registry.gitlab.com \\"
echo "       --docker-username=<your-user> \\"
echo "       --docker-password=<your-deploy-token>"
echo ""
echo "  2. Deploy with Kustomize (manual):"
echo "     kubectl apply -k k8s/overlays/dev"
echo "     kubectl apply -k k8s/monitoring"
echo ""
echo "  3. Or install ArgoCD (recommended):"
echo "     bash scripts/argocd-install.sh"
