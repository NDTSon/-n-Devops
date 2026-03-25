#!/bin/bash
# ArgoCD installation for k3d cluster with GitOps setup
# Run AFTER k3d-setup.sh

set -euo pipefail

# Configuration
ARGOCD_VERSION="stable"
KUBECTL_TIMEOUT="300s"
ARGOCD_NAMESPACE="argocd"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1" >&2; }

# Cleanup on error
cleanup() {
    [[ $? -ne 0 ]] && { error "ArgoCD installation failed!"; exit 1; }
}
trap cleanup EXIT

# Prerequisites validation
check_prerequisites() {
    log "Validating environment..."

    # Check tools and cluster access
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found in PATH"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot access Kubernetes cluster. Is k3d running?"
        exit 1
    fi

    # Verify ingress controller is ready
    if ! kubectl get namespace ingress-nginx &> /dev/null; then
        error "ingress-nginx not found. Run k3d-setup.sh first"
        exit 1
    fi

    local ingress_ready=$(kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller --no-headers 2>/dev/null | grep -c Running || echo "0")
    if [[ $ingress_ready -eq 0 ]]; then
        error "NGINX ingress controller not ready"
        exit 1
    fi

    success "Environment validation completed"
}

# Install ArgoCD components
install_argocd() {
    log "Installing ArgoCD ($ARGOCD_VERSION)..."

    # Create namespace and install ArgoCD
    kubectl create namespace $ARGOCD_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl apply -n $ARGOCD_NAMESPACE -f https://raw.githubusercontent.com/argoproj/argo-cd/$ARGOCD_VERSION/manifests/install.yaml

    # Wait for essential components
    log "Waiting for ArgoCD components..."
    for component in argocd-server argocd-application-controller argocd-repo-server; do
        kubectl wait --namespace $ARGOCD_NAMESPACE --for=condition=ready pod --selector=app.kubernetes.io/name=$component --timeout=$KUBECTL_TIMEOUT
    done

    success "ArgoCD installed and ready"
}

# Configure ArgoCD for local access
configure_argocd() {
    log "Configuring ArgoCD server..."

    # Enable insecure mode for nginx ingress
    kubectl patch deployment argocd-server -n $ARGOCD_NAMESPACE --type='json' \
        -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--insecure"}]'

    kubectl rollout status deployment/argocd-server -n $ARGOCD_NAMESPACE --timeout=$KUBECTL_TIMEOUT

    # Apply configuration
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-server-config
  namespace: $ARGOCD_NAMESPACE
data:
  url: "https://argocd.local:8443"
  insecure: "true"
EOF

    success "ArgoCD configured for local access"
}

# Setup ArgoCD ingress
setup_ingress() {
    log "Configuring ArgoCD ingress..."

    # Use existing ingress config if available, otherwise create basic one
    if [[ -f "argocd/ingress.yaml" ]]; then
        kubectl apply -f argocd/ingress.yaml
    else
        cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: $ARGOCD_NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
    nginx.ingress.kubernetes.io/grpc-backend: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
EOF
    fi

    success "ArgoCD ingress configured"
}

# Setup access credentials
setup_access() {
    log "Retrieving access credentials..."

    # Wait for admin secret
    local attempts=0
    while [[ $attempts -lt 30 ]]; do
        if kubectl get secret argocd-initial-admin-secret -n $ARGOCD_NAMESPACE &> /dev/null; then
            break
        fi
        sleep 2
        ((attempts++))
    done

    local password=$(kubectl get secret argocd-initial-admin-secret -n $ARGOCD_NAMESPACE -o jsonpath="{.data.password}" | base64 -d)

    if [[ -z "$password" ]]; then
        error "Failed to retrieve ArgoCD admin password"
        exit 1
    fi

    success "ArgoCD access configured"

    # Display access information
    echo ""
    echo "======================================="
    success "🎉 ArgoCD Installation Complete!"
    echo "======================================="
    echo ""
    echo "🌐 Access ArgoCD:"
    echo "  URL: https://argocd.local:8443"
    echo "  Username: admin"
    echo "  Password: $password"
    echo ""
    echo "📝 Add to hosts file:"
    echo "  127.0.0.1 argocd.local"
    echo ""
    echo "📦 Next steps:"
    echo "  1. Configure GitLab secret: see argocd/README.md"
    echo "  2. Deploy applications: kubectl apply -f argocd/"
    echo "  3. Monitor: kubectl get apps -n argocd"
    echo "======================================="
}

# Main execution function
main() {
    local start_time=$(date +%s)

    echo "======================================="
    echo "🚀 ArgoCD GitOps Installation"
    echo "======================================="
    echo "Version: $ARGOCD_VERSION | Namespace: $ARGOCD_NAMESPACE"
    echo "======================================="

    # Execute installation steps
    check_prerequisites
    install_argocd
    configure_argocd
    setup_ingress
    setup_access

    local duration=$(( $(date +%s) - start_time ))
    echo ""
    success "Installation completed in ${duration} seconds"
}

# Execute main function
main "$@"