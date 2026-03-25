# GitOps Infrastructure Setup Guide

Quick setup guide for local k3d cluster with ArgoCD GitOps deployment.

**Last Updated:** 2026-03-25 | **Status:** ✅ Verified Working

---

## Prerequisites

- Docker Desktop running
- `k3d`, `kubectl`, `argocd` CLI installed
- GitLab account with Personal Access Token (PAT)

---

## Quick Start (5 Minutes)

### 1. Create k3d Cluster

```bash
bash scripts/k3d-setup.sh
```

This creates a `blog-dev` cluster with 1 server + 2 agents, NGINX Ingress enabled.

**Verify:**

```bash
k3d cluster list
kubectl get nodes  # All should be Ready
```

---

### 2. Install ArgoCD

```bash
bash scripts/argocd-install.sh
```

**Get admin password:**

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

**Access ArgoCD UI:**

1. Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):
   ```
   127.0.0.1 argocd.local
   ```
2. Open `http://argocd.local:8080`
3. Login: `admin` / (password from above)

---

### 3. Connect GitLab Repository

**Create repository secret:**

```bash
kubectl apply -f argocd/gitlab-repo-secret.yaml
```

**Verify connection:**

```bash
kubectl get secret -n argocd -l argocd.argoproj.io/secret-type=repository
```

---

### 4. Setup GitLab Registry Access

**Create image pull secret:**

```bash
kubectl create secret docker-registry gitlab-registry \
  --namespace blog-app \
  --docker-server=registry.gitlab.com \
  --docker-username=mquangpham575 \
  --docker-password='<FULL_GITLAB_PAT_FROM_INFOR.MD>' \
  --docker-email=<YOUR_EMAIL>
```

⚠️ **Important:** Use the FULL PAT token from `infor.md` - don't truncate it!

---

### 5. Deploy Applications

```bash
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/blog-app.yaml
kubectl apply -f argocd/monitoring.yaml
```

**Check status:**

```bash
kubectl get applications -n argocd
kubectl get pods -n blog-app
```

Wait for all pods to be `Running` and applications to show `Synced` + `Healthy`.

---

## How It Works

### Project Structure

```
k8s/
├── base/                    # Base manifests
│   ├── kustomization.yaml  # Image tags updated here by CI
│   ├── *-service/          # Service deployments
│   └── *-db/               # Database deployments
├── overlays/
│   └── dev/                # Dev environment (what ArgoCD deploys)
└── monitoring/             # Prometheus/Grafana
```

### GitOps Workflow

1. **Push code** → GitLab CI builds & tests
2. **Docker build** → Pushes images with SHA tags to registry
3. **Deploy stage** → CI updates `k8s/base/kustomization.yaml` with new image tags
4. **ArgoCD detects** → Automatically syncs changes to cluster
5. **Rolling update** → Pods restart with new images

**Result:** Zero-downtime deployments, full Git audit trail, easy rollbacks.

---

## Daily Operations

### View Application Status

```bash
# ArgoCD apps
kubectl get applications -n argocd

# All pods
kubectl get pods -n blog-app

# Specific service logs
kubectl logs -n blog-app deployment/user-service -f
```

### Access Applications

**ArgoCD UI:**

- URL: `http://argocd.local:8080`
- User: `admin` / (password from setup)

**Blog App Services:**

```bash
# Frontend
kubectl port-forward -n blog-app svc/frontend 3000:80

# User Service
kubectl port-forward -n blog-app svc/user-service 8081:8081

# Blog Service
kubectl port-forward -n blog-app svc/blog-service 8082:8082

# File Service
kubectl port-forward -n blog-app svc/file-service 8083:8083
```

### Force ArgoCD Sync

```bash
kubectl patch application blog-app -n argocd \
  --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Restart a Service

```bash
kubectl rollout restart deployment/user-service -n blog-app
```

---

## Troubleshooting

### ❌ Pods: `ImagePullBackOff`

**Cause:** Wrong/missing GitLab registry secret or image doesn't exist.

**Fix:**

```bash
# Check secret
kubectl get secret gitlab-registry -n blog-app

# Recreate with correct PAT
kubectl delete secret gitlab-registry -n blog-app
kubectl create secret docker-registry gitlab-registry \
  --namespace blog-app \
  --docker-server=registry.gitlab.com \
  --docker-username=mquangpham575 \
  --docker-password='<FULL_PAT>' \
  --docker-email=<YOUR_EMAIL>

# Check image tag in deployment
kubectl get deployment user-service -n blog-app -o jsonpath='{.spec.template.spec.containers[0].image}'
```

If image tag is wrong (e.g., `pending-ci-build`), update `k8s/base/kustomization.yaml` to use `latest`:

```yaml
images:
  - name: registry.gitlab.com/mquangpham575/devops/user-service
    newTag: latest
```

Commit and push, then wait for ArgoCD to sync.

---

### ❌ ArgoCD: Can't Pull from GitLab

**Cause:** Missing repository credentials.

**Fix:**

```bash
# Check if secret exists
kubectl get secret -n argocd -l argocd.argoproj.io/secret-type=repository

# If missing, create it
kubectl apply -f argocd/gitlab-repo-secret.yaml

# View in UI: Settings > Repositories (should show Connected)
```

---

### ❌ ArgoCD: Application `OutOfSync`

**Cause:** Cluster state differs from Git.

**Fix:**

```bash
# Force sync
argocd app sync blog-app --force

# Or via kubectl (see "Force ArgoCD Sync" above)
```

---

### ❌ CI/CD: Deploy Stage Fails

**Common cause:** Git push conflicts with concurrent deploys.

**Fix:** Pipeline has auto-retry logic. If it keeps failing:

1. Check GitLab CI variables are set correctly
2. Ensure `CI_JOB_TOKEN` has write access
3. Pull latest `main` branch before retrying

---

### ❌ Database Connection Errors

**Cause:** Services start before databases are ready.

**Fix:** Wait for databases:

```bash
kubectl wait --for=condition=ready pod -l app=user-db -n blog-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=blog-db -n blog-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=file-db -n blog-app --timeout=300s
```

Services have readiness probes, they'll retry connections automatically.

---

## Clean Up

**Delete cluster (removes everything):**

```bash
k3d cluster delete blog-dev
```

**Rebuild from scratch:**

```bash
k3d cluster delete blog-dev
bash scripts/k3d-setup.sh
bash scripts/argocd-install.sh
kubectl apply -f argocd/gitlab-repo-secret.yaml
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/blog-app.yaml
```

---

## Quick Reference

```bash
# Cluster
k3d cluster list
kubectl get nodes
kubectl get all -n blog-app

# ArgoCD
kubectl get applications -n argocd
kubectl get application blog-app -n argocd -o yaml

# Logs
kubectl logs -n blog-app <pod-name> -f
kubectl logs -n blog-app deployment/user-service -f

# Secrets
kubectl get secrets -n blog-app
kubectl get secret gitlab-registry -n blog-app

# ArgoCD password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward ArgoCD (if ingress not working)
kubectl port-forward -n argocd svc/argocd-server 8080:80
```

---

## Important Files

| File                             | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `argocd/gitlab-repo-secret.yaml` | GitLab repo credentials for ArgoCD |
| `k8s/base/kustomization.yaml`    | Image tags (updated by CI)         |
| `k8s/overlays/dev/`              | Dev environment config             |
| `.gitlab-ci.yml`                 | CI/CD pipeline                     |
| `infor.md`                       | GitLab PAT and credentials         |

---

## Best Practices

- ✅ Always commit manifest changes to Git (let ArgoCD sync)
- ✅ Use SHA image tags in production (not `:latest`)
- ✅ Monitor ArgoCD UI for sync/health status
- ✅ Check ArgoCD before debugging pods (may auto-heal)
- ✅ Keep `infor.md` private (contains credentials)
- ❌ Don't use `kubectl apply` on resources managed by ArgoCD
- ❌ Don't commit secrets to Git

---

**Need Help?**

- ArgoCD Docs: https://argo-cd.readthedocs.io/
- k3d Docs: https://k3d.io/
- Check `SETUP_STATUS.md` for current cluster state
