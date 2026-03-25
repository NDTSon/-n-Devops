# Backup & Disaster Recovery Strategy

This document outlines comprehensive backup and disaster recovery procedures for the Blog Platform.

## Overview

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RTO** | 4 hours | Maximum acceptable downtime |
| **RPO** | 1 hour | Maximum acceptable data loss |
| **Uptime** | 99.5% | Business continuity target |
| **Data Integrity** | Zero tolerance | No data corruption acceptance |

### Scope

- Application data (PostgreSQL databases)
- Configuration data (Kubernetes manifests)
- User-generated content (SeaweedFS files)
- CI/CD configurations (GitLab settings)
- Secrets and certificates

## Backup Strategy

### 1. Database Backups

#### Automated Daily Backups

```bash
# PostgreSQL backup script (to be implemented)
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
DATABASES=("user_service_db" "blog_service_db" "file_service_db")

for DB in "${DATABASES[@]}"; do
    kubectl exec -n blog-app deployment/postgres-$DB -- \
        pg_dump -U postgres $DB > /backups/$DB_$BACKUP_DATE.sql

    # Compress and encrypt
    gzip /backups/$DB_$BACKUP_DATE.sql
    gpg --encrypt --recipient devops@company.com /backups/$DB_$BACKUP_DATE.sql.gz
done
```

### Backup Schedule

| Schedule | Time | Retention | Location |
|----------|------|-----------|----------|
| **Daily Full Backup** | 02:00 UTC | 30 days | Local PV + Cloud storage |
| **Weekly Full Backup** | Sunday 01:00 UTC | 12 weeks | Cloud storage |
| **Monthly Archive** | 1st of month 00:00 UTC | 12 months | Cold storage |

#### Point-in-Time Recovery

```bash
# WAL-E or similar for continuous archiving
# Enable continuous archiving for PostgreSQL
archive_mode = on
archive_command = 'wal-e wal-push %p'
wal_level = replica

# Restore to specific point in time
wal-e backup-fetch /var/lib/postgresql/data LATEST
# Start PostgreSQL with recovery.conf for PITR
```

### 2. File Storage Backups

#### SeaweedFS Backup Strategy

```bash
# SeaweedFS backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Backup volume data
kubectl exec -n blog-app deployment/seaweedfs-volume -- \
    tar czf /backups/seaweedfs_volumes_$BACKUP_DATE.tar.gz /data

# Backup master metadata
kubectl exec -n blog-app deployment/seaweedfs-master -- \
    cp -r /data/master.db /backups/master_$BACKUP_DATE.db

# Sync to cloud storage
aws s3 sync /backups/ s3://blog-platform-backups/seaweedfs/
```

#### File Integrity Verification

```bash
# Automated integrity checks
#!/bin/bash
# Check file checksums
find /data -type f -exec sha256sum {} \; > /backups/checksums_$(date +%Y%m%d).txt

# Compare with previous checksums
diff /backups/checksums_$(date -d "1 day ago" +%Y%m%d).txt \
     /backups/checksums_$(date +%Y%m%d).txt > /backups/integrity_report.txt
```

### 3. Configuration Backups

**Git-Based Configuration Backup**

```yaml
# Already implemented via Git repository
Scope:
  - Kubernetes manifests (k8s/)
  - ArgoCD configurations (argocd/)
  - CI/CD pipelines (.gitlab-ci.yml)
  - Documentation (docs/, README.md)

Backup Method:
  - Primary: GitLab repository with history
  - Mirror: GitHub mirror repository (optional)
  - Local: Developer workstations

Recovery Method:
  - Git clone and kubectl apply
  - ArgoCD automatic sync from Git
```

#### Secrets Backup (Encrypted)

```bash
# Secure secrets backup
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Export secrets (encrypted)
kubectl get secrets -n blog-app -o yaml | \
    gpg --encrypt --recipient devops@company.com > \
    /secure-backups/secrets_$BACKUP_DATE.yaml.gpg

kubectl get secrets -n argocd -o yaml | \
    gpg --encrypt --recipient devops@company.com > \
    /secure-backups/argocd-secrets_$BACKUP_DATE.yaml.gpg
```

### 4. Persistent Volume Backups

#### Kubernetes Volume Snapshots

```yaml
# VolumeSnapshot configuration
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: blog-platform-snapshot-class
driver: csi.storage.k8s.io
deletionPolicy: Retain
parameters:
  # Snapshot configuration
  incremental: "true"

---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: database-snapshot-daily
  namespace: blog-app
spec:
  volumeSnapshotClassName: blog-platform-snapshot-class
  source:
    persistentVolumeClaimName: postgres-data-pvc
```

#### Velero Backup Solution

```bash
# Install Velero for cluster backups
velero install \
    --provider aws \
    --plugins velero/velero-plugin-for-aws:v1.8.0 \
    --bucket blog-platform-disaster-recovery \
    --secret-file ./credentials-velero \
    --use-volume-snapshots=false \
    --backup-location-config region=us-west-2

# Create backup schedules
velero schedule create daily-backup \
    --schedule="0 2 * * *" \
    --include-namespaces blog-app,monitoring,argocd \
    --ttl 720h0m0s
```

## Disaster Recovery Procedures

### 1. Cluster Recovery

#### Complete Cluster Loss

```bash
# Step 1: Recreate k3d cluster
bash scripts/k3d-setup.sh

# Step 2: Restore ArgoCD
bash scripts/argocd-install.sh
kubectl apply -f argocd/gitlab-repo-secret.yaml
kubectl apply -f argocd/project.yaml

# Step 3: Restore applications via GitOps
kubectl apply -f argocd/blog-app.yaml
kubectl apply -f argocd/monitoring.yaml

# Step 4: Restore data (see database recovery)
```

#### Partial Service Failure

```bash
# Identify failed services
kubectl get pods -n blog-app
kubectl describe pod <failed-pod-name> -n blog-app

# Check ArgoCD for sync issues
kubectl get applications -n argocd
argocd app sync <app-name> --force

# Manual intervention if needed
kubectl rollout restart deployment/<service-name> -n blog-app
```

### 2. Database Recovery

#### PostgreSQL Recovery Procedures

```bash
# Step 1: Stop application services
kubectl scale deployment/user-service --replicas=0 -n blog-app
kubectl scale deployment/blog-service --replicas=0 -n blog-app
kubectl scale deployment/file-service --replicas=0 -n blog-app

# Step 2: Restore database from backup
kubectl exec -n blog-app deployment/postgres-user-db -- \
    psql -U postgres -d user_service_db < /backups/user_service_db_latest.sql

# Step 3: Verify data integrity
kubectl exec -n blog-app deployment/postgres-user-db -- \
    psql -U postgres -d user_service_db -c "SELECT COUNT(*) FROM users;"

# Step 4: Restart services
kubectl scale deployment/user-service --replicas=1 -n blog-app
# Repeat for other services
```

#### Point-in-Time Recovery

```bash
# Restore to specific timestamp
RECOVERY_TIME="2026-03-25 14:30:00"

# Stop PostgreSQL
kubectl scale statefulset/postgres-user-db --replicas=0 -n blog-app

# Restore base backup
wal-e backup-fetch /var/lib/postgresql/data LATEST

# Configure recovery
cat > recovery.conf << EOF
restore_command = 'wal-e wal-fetch "%f" "%p"'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL in recovery mode
kubectl scale statefulset/postgres-user-db --replicas=1 -n blog-app
```

### 3. File Storage Recovery

#### SeaweedFS Recovery

```bash
# Step 1: Stop file service
kubectl scale deployment/file-service --replicas=0 -n blog-app
kubectl scale deployment/seaweedfs-master --replicas=0 -n blog-app
kubectl scale deployment/seaweedfs-volume --replicas=0 -n blog-app

# Step 2: Restore volume data
kubectl cp /backups/seaweedfs_volumes_latest.tar.gz \
    blog-app/seaweedfs-volume-0:/tmp/
kubectl exec -n blog-app seaweedfs-volume-0 -- \
    tar xzf /tmp/seaweedfs_volumes_latest.tar.gz -C /

# Step 3: Restore master metadata
kubectl cp /backups/master_latest.db \
    blog-app/seaweedfs-master-0:/data/master.db

# Step 4: Restart services
kubectl scale deployment/seaweedfs-master --replicas=1 -n blog-app
kubectl scale deployment/seaweedfs-volume --replicas=1 -n blog-app
kubectl scale deployment/file-service --replicas=1 -n blog-app
```

## Testing & Validation

### Recovery Testing Schedule

| Frequency | Tests Performed | Timeline |
|-----------|-----------------|----------|
| **Monthly** | Database backup restore test, Configuration rollback test, Service restart procedures | Last day of month |
| **Quarterly** | Complete disaster recovery simulation, Cross-region failover (when implemented), Security incident response | End of quarter |
| **Annual** | Full disaster recovery exercise, Business continuity plan validation, External audit of recovery procedures | End of year |

### Automated Testing

```bash
# Backup validation script
#!/bin/bash
# Test database backup integrity
pg_restore --list /backups/latest_backup.sql > /tmp/backup_contents.txt
if [ $? -eq 0 ]; then
    echo "SUCCESS: Backup integrity verified"
else
    echo "ERROR: Backup corrupted - investigate immediately"
    # Send alert to operations team
fi

# Test file checksums
sha256sum -c /backups/checksums_latest.txt
if [ $? -eq 0 ]; then
    echo "SUCCESS: File integrity verified"
else
    echo "ERROR: File corruption detected"
fi
```

## Monitoring & Alerting

### Backup Monitoring

```yaml
# Prometheus alerts for backup failures
- alert: BackupFailed
  expr: backup_job_success == 0
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "Backup job failed"
    description: "{{ $labels.job }} backup has failed"

- alert: BackupDelayed
  expr: time() - backup_job_last_success_timestamp > 86400
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Backup is overdue"
    description: "No successful backup in 24 hours"
```

### Recovery Testing Alerts

```yaml
- alert: RecoveryTestOverdue
  expr: time() - recovery_test_last_run_timestamp > 2592000 # 30 days
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Recovery test is overdue"
    description: "Recovery procedures have not been tested in 30 days"
```

## Documentation & Training

### Key Procedures

**Database Recovery:**
1. Stop affected services
2. Restore from latest PostgreSQL backup
3. Verify data integrity
4. Restart services and validate

**Application Recovery:**
1. Check ArgoCD sync status
2. If needed, force sync: `argocd app sync blog-app --force`
3. Monitor pod startup
4. Verify health endpoints

### Team Training Requirements

| Training Area | Target Audience | Schedule |
|---------------|----------------|----------|
| **Backup and recovery procedures** | All team members | Initial: Within 30 days of joining |
| **Incident response protocols** | All team members | Refresher: Every 6 months |
| **Database administration** | DBA + Senior developers | After incidents: Within 2 weeks |
| **Kubernetes administration** | DevOps team | Ongoing as needed |

## Continuous Improvement

### Metrics to Track

- Recovery Time Actual (RTA) vs Recovery Time Objective (RTO)
- Recovery Point Actual (RPA) vs Recovery Point Objective (RPO)
- Backup success rate (target: 99.5%)
- Recovery test pass rate (target: 100%)

### Regular Reviews

- **Monthly**: Backup and recovery metrics review
- **Quarterly**: Disaster recovery plan updates
- **Semi-annually**: Business impact assessment
- **Annually**: Complete strategy overhaul

---

**Emergency Contact**: DevOps Team (24/7 on-call rotation)
**Document Owner**: Infrastructure Team Lead
**Next Review**: 2026-06-25
**Classification**: Internal Use Only
