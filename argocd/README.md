# ArgoCD Configuration

GitOps configuration files for blog platform deployment.

## Files

| File | Purpose |
|------|---------|
| `project.yaml` | ArgoCD AppProject with resource permissions |
| `blog-app.yaml` | Main application deployment |
| `monitoring.yaml` | Prometheus + Grafana stack |
| `ingress.yaml` | ArgoCD UI ingress |
| `rbac-config.yaml` | Role-based access control |
| `gitlab-repo-secret.yaml.template` | GitLab repository access template |

## Setup

```bash
# 1. Configure repository access
cp gitlab-repo-secret.yaml.template gitlab-repo-secret.yaml
# Edit gitlab-repo-secret.yaml with your GitLab PAT
kubectl apply -f gitlab-repo-secret.yaml

# 2. Deploy applications
kubectl apply -f project.yaml
kubectl apply -f blog-app.yaml
kubectl apply -f monitoring.yaml
```

## Access

- **URL**: `https://argocd.local:8443`
- **Username**: `admin`
- **Password**:
  ```bash
  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
  ```

## Troubleshooting

```bash
# Check status
kubectl get applications -n argocd

# Force sync
argocd app sync blog-app --force

# View logs
kubectl logs -n argocd deployment/argocd-server -f
```

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Main README](../README.md)
