# GitOps Infrastructure Setup Guide

This guide details the complete, zero-problem setup for your local k3d Kubernetes cluster, ArgoCD, and GitLab CI pipeline. 
This infrastructure uses a true GitOps strategy where **ArgoCD pulls changes** from your Git repository rather than your CI pushing via SSH.

---

## 1. Prerequisites
- Docker Desktop / Docker Engine
- `k3d` CLI installed
- `kubectl` configured
- `argocd` CLI installed (optional but recommended)

---

## 2. Local Cluster Creation
Your cluster requires properly mapped load balancer ports and NGINX Ingress to expose ArgoCD and your App UIs cleanly without manual port-forwarding.

**Run the cluster setup script:**
```bash
bash scripts/k3d-setup.sh
```
*What this does:*
- Creates a `blog-dev` k3d cluster (1 server, 2 agents).
- Maps host ports `8080:80`, `8443:443`, and `19090:9090` (Prometheus) to the cluster's internal load balancer.
- Disables the default Traefik so NGINX Ingress can be used.
- Installs NGINX Ingress and waits for it to be ready.
- Sets up standard namespaces (`blog-app`) and secrets.

---

## 3. ArgoCD Installation & Configuration
Instead of using explicit port-forwarding, ArgoCD is exposed via `argocd.local` on your host.

**Run the ArgoCD installation script:**
```bash
bash scripts/argocd-install.sh
```

*What this does:*
- Installs the stable ArgoCD release into the `argocd` namespace (using `--server-side --force-conflicts` to bypass Kubernetes annotation size limits on large CRDs).
- Patches the ArgoCD server deployment with `--insecure`. This forces internal communication to HTTP so the NGINX Ingress controller can handle SSL Termination.
- Applies `argocd/ingress.yaml` which exposes ArgoCD at `https://argocd.local:8443`.

**Finalizing Local Access:**
1. Open your host machine's hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows, or `/etc/hosts` on Linux/Mac).
2. Add this line:
   ```text
   127.0.0.1 argocd.local
   ```
3. Open your browser to `https://argocd.local:8443`. Ignore the self-signed certificate warning.
4. Log in using `admin` and the password output by the installation script.

---

## 4. Connecting Git & Deploying Apps
Once logged in, hook up the DevOps repository:

1. **Add Repository Credentials:** Provide ArgoCD with access to pull your code:
   ```bash
   argocd login argocd.local:8443 --username admin --password '<your-password>'
   argocd repo add https://gitlab.com/mquangpham575/DevOps.git --username <gitlab-user> --password <personal-access-token>
   ```

2. **Apply the Declarative Setup:**
   Instead of manually creating apps via the UI, use the declarative manifests which are configured to track the `HEAD` (main) branch:
   ```bash
   kubectl apply -f argocd/project.yaml
   kubectl apply -f argocd/blog-app.yaml
   kubectl apply -f argocd/monitoring.yaml
   ```

ArgoCD will immediately detect your services, databases, and monitoring stack in `k8s/overlays/dev` and sync them down to the cluster!

---

## 5. The CI/CD Workflow (GitOps)
The `.gitlab-ci.yml` has been rewritten to follow standard GitOps patterns. 
No SSH deployments are performed anymore.

**The automated flow works as follows:**
1. **Commit:** You push code to `main`.
2. **Build & Test:** GitLab CI builds your Java/Node code (`build-*` and `test-*` jobs) reusing cached Maven/Node modules.
3. **Docker Build:** `docker-*` jobs build your images and append the Git short SHA as the tag (e.g., `registry.gitlab.com/.../user-service:a1b2c3d`).
4. **Update Manifests (Deploy Stage):** 
   - Instead of trying to connect to your cluster via SSH, the CI clones the DevOps repo itself.
   - It runs a `sed` command to update the image tags in `k8s/overlays/prod/kustomization.yaml` with the new short SHA.
   - It commits those changes back to the GitLab `main` branch.
5. **Sync (ArgoCD):** 
   - ArgoCD detects the new commit in `k8s/overlays/prod/kustomization.yaml`.
   - ArgoCD tells Kubernetes to pull the new Image and perform a rolling restart on the pods.

Zero downtime, complete audit log, and 0 manual problems!
