#!/bin/bash
# Install ArgoCD into the k3d/k3s cluster
# Run AFTER k3d-setup.sh

set -euo pipefail

echo "=== Installing ArgoCD ==="

# Create namespace and install
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "Waiting for ArgoCD server to be ready..."
kubectl wait --namespace argocd \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=argocd-server \
  --timeout=300s

# Expose ArgoCD via NodePort for local access
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443}]}}'

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "=== ArgoCD installed! ==="
echo ""
echo "Access:  https://localhost:30443"
echo "User:    admin"
echo "Password: $ARGOCD_PASSWORD"
echo ""
echo "Next steps:"
echo "  1. Add your GitLab repo to ArgoCD:"
echo "     argocd login localhost:30443 --insecure --username admin --password '$ARGOCD_PASSWORD'"
echo "     argocd repo add https://gitlab.com/mquangpham575/DevOps.git \\"
echo "       --username <gitlab-user> \\"
echo "       --password <personal-access-token>"
echo ""
echo "  2. Apply ArgoCD applications:"
echo "     kubectl apply -f argocd/project.yaml"
echo "     kubectl apply -f argocd/blog-app.yaml"
echo "     kubectl apply -f argocd/monitoring.yaml"
echo ""
echo "  3. Watch the sync:"
echo "     argocd app list"
echo "     argocd app get blog-app"
