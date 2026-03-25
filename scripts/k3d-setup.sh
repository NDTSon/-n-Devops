#!/bin/bash
# k3d cluster setup for local development with ArgoCD and GitOps
# Prerequisites: Docker Desktop, k3d, kubectl

set -euo pipefail

# Configuration
CLUSTER_NAME="blog-dev"
K3S_VERSION="v1.29.3+k3s1"  # Updated to latest stable
KUBECTL_TIMEOUT="300s"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Logging functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1" >&2; }

# Cleanup on error
cleanup() {
    [[ $? -ne 0 ]] && { error "Setup failed! Cleaning up..."; k3d cluster delete $CLUSTER_NAME 2>/dev/null || true; exit 1; }
}
trap cleanup EXIT

# Prerequisites validation
check_prerequisites() {
    log "Validating prerequisites..."

    # Check required tools
    local tools=("docker" "k3d" "kubectl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is not installed or not in PATH"
            exit 1
        fi
    done

    # Verify Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi

    # Check Docker memory
    local docker_mem=$(docker system info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
    [[ $docker_mem -lt 4000000000 ]] && warn "Docker has less than 4GB memory allocated"

    success "All prerequisites validated"
}

# Create k3d cluster with optimized configuration
create_cluster() {
    log "Creating k3d cluster: $CLUSTER_NAME"

    # Clean existing cluster
    k3d cluster list | grep -q "$CLUSTER_NAME" && {
        warn "Deleting existing cluster..."
        k3d cluster delete $CLUSTER_NAME
    }

    # Create cluster with production-like setup
    k3d cluster create $CLUSTER_NAME \
        --image "rancher/k3s:${K3S_VERSION}" \
        --servers 1 --agents 2 \
        --port "8080:80@loadbalancer" \
        --port "8443:443@loadbalancer" \
        --port "19090:9090@loadbalancer" \
        --k3s-arg "--disable=traefik@server:0" \
        --k3s-arg "--kubelet-arg=eviction-hard=memory.available<512Mi@agent:*" \
        --wait

    success "k3d cluster '$CLUSTER_NAME' created (1 server + 2 agents)"
}

# Verify cluster health and readiness
verify_cluster() {
    log "Verifying cluster health..."

    # Wait for nodes and core pods
    kubectl wait --for=condition=Ready nodes --all --timeout=$KUBECTL_TIMEOUT
    kubectl wait --namespace kube-system --for=condition=ready pod --selector=k8s-app=kube-dns --timeout=$KUBECTL_TIMEOUT

    # Display cluster info
    echo -e "\n${GREEN}Cluster Status:${NC}"
    kubectl get nodes -o wide
    kubectl cluster-info --context k3d-$CLUSTER_NAME

    success "Cluster verification completed"
}

# Install NGINX Ingress Controller
install_ingress() {
    log "Installing NGINX Ingress Controller..."

    # Deploy ingress controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml

    # Wait for controller to be ready
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=$KUBECTL_TIMEOUT

    success "NGINX Ingress Controller deployed and ready"
}

# Setup base configuration and resource management
setup_base_configuration() {
    log "Configuring namespaces and resource limits..."

    # Create namespaces
    for ns in blog-app monitoring; do
        kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
    done

    # Apply resource quotas for development environment
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: blog-app
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: dev-limits
  namespace: blog-app
spec:
  limits:
  - default:
      cpu: 500m
      memory: 512Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    type: Container
  - max:
      cpu: 2
      memory: 2Gi
    type: Container
EOF

    success "Base configuration applied (namespaces, quotas, limits)"
}

# Main execution function
main() {
    local start_time=$(date +%s)

    echo "========================================="
    echo "🚀 k3d Kubernetes Cluster Setup"
    echo "========================================="
    echo "Cluster: $CLUSTER_NAME | K3s: $K3S_VERSION"
    echo "========================================="

    # Execute setup steps
    check_prerequisites
    create_cluster
    verify_cluster
    install_ingress
    setup_base_configuration

    # Calculate and display results
    local duration=$(( $(date +%s) - start_time ))
    echo ""
    echo "========================================="
    success "🎉 Cluster '$CLUSTER_NAME' ready! (${duration}s)"
    echo "========================================="
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Install ArgoCD: bash scripts/argocd-install.sh"
    echo "  2. Create registry secret (see argocd/README.md)"
    echo "  3. Deploy applications via ArgoCD"
    echo ""
    echo "🔗 Access:"
    echo "  • ArgoCD UI: https://argocd.local:8443 (after install)"
    echo "  • Port-forward: kubectl port-forward -n blog-app svc/SERVICE PORT"
    echo ""
    echo "📊 Monitor:"
    echo "  • kubectl get pods -n blog-app"
    echo "  • kubectl get all -n blog-app"
    echo "========================================="
}

# Execute main function
main "$@"