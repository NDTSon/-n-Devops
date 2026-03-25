# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          GitLab                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Code Repository  │  │  Container Registry  │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ GitOps Pull
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      k3d Cluster                           │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │     ArgoCD      │  │          blog-app namespace      │  │
│  │                 │  │                                 │  │
│  │  - Monitors Git │  │  ┌─────────────┐                │  │
│  │  - Auto-sync    │  │  │ User Service │                │  │
│  │  - Management   │  │  └─────────────┘                │  │
│  └─────────────────┘  │                                 │  │
│                       │  ┌─────────────┐                │  │
│  ┌─────────────────┐  │  │ Blog Service │                │  │
│  │   Monitoring    │  │  └─────────────┘                │  │
│  │                 │  │                                 │  │
│  │  - Prometheus   │  │  ┌─────────────┐                │  │
│  │  - Grafana      │  │  │ File Service │                │  │
│  └─────────────────┘  │  └─────────────┘                │  │
│                       │                                 │  │
│                       │  ┌─────────────┐                │  │
│                       │  │  Frontend   │                │  │
│                       │  └─────────────┘                │  │
│                       │                                 │  │
│                       │  ┌─────────────┐                │  │
│                       │  │ Databases   │                │  │
│                       │  │ + SeaweedFS │                │  │
│                       │  └─────────────┘                │  │
│                       └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Development
- **Languages**: Java 17, JavaScript/TypeScript
- **Frameworks**: Spring Boot, React
- **Build Tools**: Maven, npm

### Infrastructure
- **Container Runtime**: Docker
- **Orchestration**: Kubernetes (k3d)
- **GitOps**: ArgoCD
- **CI/CD**: GitLab CI/CD
- **Ingress**: NGINX Ingress Controller

### Data Layer
- **Primary DB**: PostgreSQL (per service)
- **File Storage**: SeaweedFS (distributed)
- **Caching**: Built into services

### Monitoring & Observability
- **Metrics**: Prometheus
- **Visualization**: Grafana
- **Logging**: Kubernetes logs
- **Security Scanning**: Trivy

## Service Architecture

### Microservices Design
Each service follows the same pattern:
- **Independent deployment**
- **Own database**
- **REST API**
- **Health checks**
- **Graceful shutdown**

### Communication
- **Synchronous**: HTTP/REST between services
- **Service Discovery**: Kubernetes DNS
- **Load Balancing**: Kubernetes Services

### Security
- **JWT Authentication**: Handled by user-service
- **Service-to-Service**: Internal cluster communication
- **Secrets Management**: Kubernetes Secrets
- **Container Scanning**: Trivy in CI/CD

## Deployment Strategy

### GitOps Flow
1. **Developer** pushes code to GitLab
2. **GitLab CI** builds and tests code
3. **Docker images** built and pushed to registry
4. **Kustomization updated** with new image tags
5. **ArgoCD detects** changes in Git
6. **Rolling deployment** to k3d cluster

### Zero-Downtime Deployments
- **Rolling Updates**: Kubernetes default strategy
- **Readiness Probes**: Health checks before traffic routing
- **Liveness Probes**: Restart unhealthy containers
- **Resource Limits**: Prevent resource starvation

### Environment Management
- **Base Configuration**: `k8s/base/`
- **Environment Overlays**: `k8s/overlays/dev/`
- **Secrets**: Managed locally, not in Git
- **Config Maps**: Environment-specific settings

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: Easy to scale
- **Database**: Single instance per service (good for dev)
- **File Storage**: SeaweedFS naturally distributed

### Resource Management
- **Resource Limits**: Prevent noisy neighbors
- **Resource Requests**: Guarantee minimum resources
- **Auto-scaling**: Can be added with HPA

## Development Workflow

### Local Development
1. **docker-compose up**: All services locally
2. **Port forwarding**: Access individual services
3. **Hot reload**: Frontend development server

### CI/CD Pipeline
1. **Change Detection**: Only build changed services
2. **Parallel Builds**: Maven caching for speed
3. **Security Scanning**: Trivy on all images
4. **Automated Deployment**: GitOps with ArgoCD

### Testing Strategy
- **Unit Tests**: Maven/Jest in CI
- **Integration Tests**: Service startup validation
- **End-to-End**: Manual testing via port-forward

## Monitoring & Troubleshooting

### Observability
- **Application Metrics**: Spring Boot Actuator
- **Infrastructure Metrics**: Prometheus node exporters
- **Dashboards**: Grafana visualizations
- **Alerts**: Can be configured in Prometheus

### Debugging
- **Pod Logs**: `kubectl logs -f deployment/service-name`
- **Service Connectivity**: Port forwarding
- **Database Access**: Direct pod access
- **ArgoCD UI**: Visual deployment status

## Future Improvements

### Short Term
- **Health Dashboards**: Grafana configuration
- **Automated Tests**: Integration test suite
- **Documentation**: API docs with Swagger

### Long Term
- **Production Environment**: Separate k8s cluster
- **Database HA**: PostgreSQL replicas
- **Caching Layer**: Redis for session management
- **API Gateway**: Centralized routing and auth