# Configuration Management

This directory contains centralized configuration files for the Blog Platform project.

## Environment Configuration

### Available Configurations

| Environment | File | Purpose |
|-------------|------|---------|
| **Template** | `.env.example` | Complete template with all available options |
| **Development** | `development.env` | Local development with Spring Boot services |
| **Docker** | `docker-compose.env` | Containerized development with Docker Compose |
| **Production** | `production.env` | Production deployment configuration |

### Usage Instructions

**1. For Frontend Development:**
```bash
# Copy the appropriate environment file to frontend/.env
cp config/environments/development.env frontend/.env

# Or for Docker development:
cp config/environments/docker-compose.env frontend/.env

# Start frontend development server
cd frontend && npm run dev
```

**2. For Production Build:**
```bash
# Copy production configuration
cp config/environments/production.env frontend/.env

# Update with your actual domain URLs
nano frontend/.env

# Build for production
cd frontend && npm run build
```

**3. For Different Deployment Scenarios:**
```bash
# Local development (Spring Boot + npm)
cp config/environments/development.env frontend/.env

# Full Docker stack
cp config/environments/docker-compose.env frontend/.env
docker-compose up -d

# Kubernetes development
cp config/environments/development.env frontend/.env
kubectl port-forward -n blog-app svc/user-service 8081:8081
kubectl port-forward -n blog-app svc/blog-service 8082:8082
kubectl port-forward -n blog-app svc/file-service 8083:8083
```

## Configuration Variables

### API Endpoints
- `VITE_API_USER_SERVICE` - User service API base URL
- `VITE_API_BLOG_SERVICE` - Blog service API base URL
- `VITE_API_FILE_SERVICE` - File service API base URL

### Development Proxy (Vite)
- `VITE_BACKEND_HOST` - Backend hostname for proxy
- `VITE_BACKEND_USER_PORT` - User service port for proxy
- `VITE_BACKEND_BLOG_PORT` - Blog service port for proxy
- `VITE_BACKEND_FILE_PORT` - File service port for proxy

### Application Settings
- `VITE_APP_TITLE` - Application title shown in browser
- `VITE_ENV` - Environment identifier (development/docker/production)

## Security Guidelines

### Local Development
- ✅ HTTP is acceptable for local development
- ✅ Use localhost or 127.0.0.1 for security
- ❌ Never commit actual credentials to configuration files

### Production
- ✅ Always use HTTPS in production
- ✅ Use proper domain names with SSL certificates
- ✅ Configure CORS policies appropriately
- ✅ Use environment variables or secret management for sensitive data
- ❌ Never hardcode sensitive information in configuration files

## Migration from Old Structure

The old scattered environment files have been consolidated:

```bash
# Old structure (deprecated)
frontend/.env           # Empty - not used
frontend/.env.dev       # → config/environments/development.env
frontend/.env.dockerlocal # → config/environments/docker-compose.env
frontend/.env.localonly # → config/environments/development.env (merged)
frontend/.env.prod      # → config/environments/production.env

# New structure (current)
config/environments/
├── .env.example        # Complete template
├── development.env     # Local development
├── docker-compose.env  # Docker development
└── production.env      # Production deployment
```

## Environment Setup Workflow

**1. Choose Your Development Mode:**
- **Local Services**: Backend services run with Maven, database with Docker
- **Full Docker**: All services run in containers via Docker Compose
- **Kubernetes**: Services in K8s cluster, frontend local with port-forwarding

**2. Copy Appropriate Configuration:**
```bash
# For local development
cp config/environments/development.env frontend/.env

# For Docker development
cp config/environments/docker-compose.env frontend/.env
```

**3. Customize if Needed:**
- Update URLs to match your setup
- Modify ports if you have conflicts
- Change application title if desired

**4. Verify Configuration:**
```bash
# Check environment variables are loaded
cd frontend && npm run dev
# Open browser console and verify API endpoints are correct
```

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **CORS errors** | Ensure backend CORS configuration allows frontend origin |
| **Connection refused** | Verify backend services are running on expected ports |
| **404 API errors** | Check API endpoint URLs match backend service paths |
| **Build failures** | Ensure all VITE_* variables are properly set |

### Port Conflicts

If you encounter port conflicts, update the configuration:
```bash
# Original ports
VITE_BACKEND_USER_PORT=8081
VITE_BACKEND_BLOG_PORT=8082
VITE_BACKEND_FILE_PORT=8083

# Alternative ports
VITE_BACKEND_USER_PORT=9001
VITE_BACKEND_BLOG_PORT=9002
VITE_BACKEND_FILE_PORT=9003
```

### Environment Verification

```bash
# Verify variables are loaded correctly
cd frontend
npm run dev -- --mode development
# Check browser console for loaded environment variables
```

---

**Next Steps**: Consider using a proper secrets management solution (like HashiCorp Vault or Kubernetes Secrets) for production deployments.

**Document Owner**: DevOps Team
**Last Updated**: 2026-03-25