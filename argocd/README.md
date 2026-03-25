# ArgoCD Configuration

## ⚠️ Important: Secrets Setup

The files in this directory contain **secret templates** that must be configured locally.

### How to Set Up Secrets

1. **Copy the template:**

   ```bash
   cp gitlab-repo-secret.yaml.template gitlab-repo-secret.yaml
   ```

2. **Edit the file and replace placeholders:**

   ```bash
   # Replace <YOUR_GITLAB_PAT_TOKEN> with the actual PAT from infor.md
   ```

3. **Apply to cluster:**
   ```bash
   kubectl apply -f argocd/gitlab-repo-secret.yaml
   ```

### ⚠️ NEVER COMMIT SECRETS!

- ❌ `gitlab-repo-secret.yaml` (contains actual credentials) - **IGNORED by Git**
- ✅ `gitlab-repo-secret.yaml.template` (safe to commit) - **Template only**

The `.gitignore` file prevents accidental commits of secret files.

### Where to Get Credentials

Check the `infor.md` file (also gitignored) for:

- GitLab Personal Access Token (PAT)
- GitLab username
- Other sensitive credentials

**Note:** If you don't have `infor.md`, ask the project owner for credentials.
