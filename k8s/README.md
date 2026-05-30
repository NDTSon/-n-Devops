# OpenStack + K3s deployment guide

This guide follows the blueprint in deploy.md and provides a complete, ready-to-apply Kubernetes layout plus Terraform for OpenStack VMs.

## 1) Terraform (OpenStack)

### Structure
```
terraform/
  envs/
    dev/
    prod/
  modules/
    vm/
```

### Steps (dev example)
```
cd terraform/envs/dev
terraform init
terraform apply
```

Notes:
- Set OpenStack auth variables in your shell (OS_AUTH_URL, OS_USERNAME, OS_PASSWORD, OS_PROJECT_NAME, OS_REGION_NAME, OS_USER_DOMAIN_NAME, OS_PROJECT_DOMAIN_NAME).
- Adjust image, flavor, key, network in terraform/envs/*/variables.tf.

## 2) Install K3s

### On master
```
curl -sfL https://get.k3s.io | sh -
```

Get token:
```
sudo cat /var/lib/rancher/k3s/server/node-token
```

### On worker
```
curl -sfL https://get.k3s.io | \
  K3S_URL=https://<MASTER_IP>:6443 \
  K3S_TOKEN=<TOKEN> sh -
```

Check:
```
kubectl get nodes
```

## 3) Build and push images

Replace your-registry with your real registry.

```
docker build -t your-registry/user-service:latest ./backend/user-service
docker build -t your-registry/blog-service:latest ./backend/blog-service
docker build -t your-registry/file-service:latest ./backend/file-service
docker build -t your-registry/interaction-service:latest ./backend/interaction-service
docker build -t your-registry/customer-service:latest ./backend/customer-service
docker build -t your-registry/frontend:latest ./frontend

docker push your-registry/user-service:latest
docker push your-registry/blog-service:latest
docker push your-registry/file-service:latest
docker push your-registry/interaction-service:latest
docker push your-registry/customer-service:latest
docker push your-registry/frontend:latest
```

## 4) Update manifests

Edit the Kubernetes manifests before applying:
- Image names in k8s/base/services/*.yaml and k8s/base/frontend/frontend.yaml
- StorageClass names in k8s/base/storage/*.yaml and k8s/base/database/*.yaml
- Ingress host in k8s/base/ingress.yaml
- Secrets in k8s/base/config/secret.yaml

Uploads PVC needs RWX storage. On OpenStack this is usually Manila or NFS. Update storageClassName accordingly.

## 5) Single cluster: dev/prod by namespace

With limited resources (10GB RAM / 100GB disk), use one K3s cluster and separate dev/prod by namespace. This is the most stable setup and still correct conceptually.

### Kustomize overlays
This repo includes overlays:
- k8s/overlays/dev (replicas=1, no HPA)
- k8s/overlays/prod (replicas=2, HPA enabled)

Apply dev:
```
kubectl apply -k k8s/overlays/dev
```

Apply prod:
```
kubectl apply -k k8s/overlays/prod
```

Check:
```
kubectl -n dev get pods
kubectl -n prod get pods
```

## 6) Metrics Server + HPA (prod only)

Install metrics server:
```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Apply HPA for prod:
```
kubectl apply -k k8s/overlays/prod
```

Check:
```
kubectl -n blog-platform get hpa
```

## 7) Demo autoscaling

Generate load:
```
while true; do curl http://<frontend-ip>; done
```

Watch pods:
```
kubectl -n prod get pods -w
```

## 8) Dev vs Prod rules (low-resource friendly)

- Dev: replicas = 1, no HPA
- Prod: replicas = 2, HPA enabled
- Keep requests/limits small (already set in service manifests)

If you need to reduce usage further, lower cpu/memory in k8s/base/services/*.yaml and k8s/base/frontend/frontend.yaml.

## 9) Ingress note (K3s)

K3s uses Traefik by default. The Ingress in k8s/base/ingress.yaml sets ingressClassName to traefik.

## 10) Logging (lightweight)

For low resource usage, use kubectl logs and avoid heavy stacks:
```
kubectl -n prod logs deploy/user-service
```

## 11) Report one-liner

Terraform provisions OpenStack VMs, K3s runs a multi-node Kubernetes cluster for dev and prod, and microservices are deployed with HPA for autoscaling.
