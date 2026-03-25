# DevOps Blog Platform

A full-stack microservices blog platform with GitOps deployment using k3d, ArgoCD, and GitLab CI/CD.

## 🏗️ Architecture

- **Backend**: Spring Boot microservices (Java 17)
  - User Service (Port 8081)
  - Blog Service (Port 8082)
  - File Service (Port 8083)
- **Frontend**: React application (Port 3000)
- **Databases**: PostgreSQL per service
- **Storage**: SeaweedFS for file storage
- **Infrastructure**: k3d (Kubernetes), ArgoCD (GitOps), GitLab CI/CD
- **Monitoring**: Prometheus + Grafana

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- k3d, kubectl, argocd CLI
- GitLab account with Personal Access Token

### Setup

```bash
# 1. Create k3d cluster
bash scripts/k3d-setup.sh

# 2. Install ArgoCD
bash scripts/argocd-install.sh

# 3. Configure secrets (see argocd/README.md)
cp argocd/gitlab-repo-secret.yaml.template argocd/gitlab-repo-secret.yaml
# Edit with your GitLab PAT from infor.md

# 4. Deploy applications
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/blog-app.yaml
kubectl apply -f argocd/monitoring.yaml
```

### Access Applications

- **ArgoCD**: http://argocd.local:8080
- **Blog App**: Port-forward services (see setup guide)

## 📁 Project Structure

```
├── backend/                 # Spring Boot microservices
│   ├── user-service/       # Authentication & user management
│   ├── blog-service/       # Blog posts & comments
│   └── file-service/       # File upload & storage
├── frontend/               # React UI
├── k8s/                   # Kubernetes manifests
│   ├── base/              # Base configurations
│   ├── overlays/dev/      # Development environment
│   └── monitoring/        # Prometheus & Grafana
├── argocd/                # ArgoCD applications & secrets
├── scripts/               # Setup scripts
├── .gitlab-ci.yml         # CI/CD pipeline
└── docker-compose.yml     # Local development
```

## 🔄 GitOps Workflow

1. **Code Change** → Push to `main` branch
2. **GitLab CI** → Build, test, create Docker images
3. **Deploy Stage** → Update image tags in `k8s/base/kustomization.yaml`
4. **ArgoCD** → Detect changes and sync to cluster
5. **Rolling Update** → Zero-downtime deployment

## 📚 Documentation

- [**Setup Guide**](k3d-argocd-setup-guide.md) - Complete installation instructions
- [**ArgoCD Setup**](argocd/README.md) - Secret configuration
- [**API Documentation**](backend/) - Service endpoints
- [**Architecture Decisions**](docs/) - Design decisions and trade-offs

## 🛠️ Development

### Local Development

```bash
# Start all services locally
docker-compose up

# Access services
# Frontend: http://localhost:3000
# User Service: http://localhost:8081
# Blog Service: http://localhost:8082
# File Service: http://localhost:8083
```

### Testing Changes

```bash
# Make code changes in backend/frontend
git add . && git commit -m "feat: your change"
git push origin main

# Watch ArgoCD for automatic deployment
kubectl get pods -n blog-app -w
```

## 🔐 Security

- GitLab Personal Access Tokens in `infor.md` (gitignored)
- Kubernetes secrets for registry access
- HTTPS ingress with SSL termination
- Container vulnerability scanning with Trivy

## 🚨 Troubleshooting

Common issues and solutions:

- **ImagePullBackOff**: Check GitLab registry secret
- **ArgoCD sync issues**: Verify repository credentials
- **Database connections**: Wait for DB readiness probes
- **CI/CD failures**: Check GitLab pipeline logs

See [Setup Guide](k3d-argocd-setup-guide.md#troubleshooting) for detailed troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with docker-compose
5. Submit a pull request

## 📄 License

This project is for educational purposes as part of NT548.Q21 DevOps course.

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-03-25
**k3d Cluster**: blog-dev (3 nodes)
**ArgoCD**: Synced & Healthy
