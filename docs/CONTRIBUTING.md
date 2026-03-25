# Contributing Guidelines

This guide outlines the development workflow, coding standards, and contribution procedures for the Blog Platform project.

## Development Workflow

### Getting Started

**Prerequisites:**
- Docker Desktop (4GB+ memory)
- `k3d`, `kubectl` CLI tools
- GitLab account with Personal Access Token
- Java 17+ for backend development
- Node.js 18+ for frontend development

**Local Setup:**
```bash
# 1. Clone repository
git clone <repository-url>
cd devops-blog-platform

# 2. Start local development environment
docker-compose up -d

# 3. Setup Kubernetes environment (optional)
bash scripts/k3d-setup.sh
bash scripts/argocd-install.sh
```

### Branch Strategy

| Branch Type | Purpose | Naming Convention |
|-------------|---------|------------------|
| **main** | Production-ready code | `main` |
| **feature** | New features | `feature/user-authentication` |
| **bugfix** | Bug fixes | `bugfix/login-validation` |
| **hotfix** | Emergency fixes | `hotfix/security-patch` |

### Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Locally**
   ```bash
   # Backend tests
   cd backend/user-service && ./mvnw test

   # Frontend tests
   cd frontend && npm test

   # Integration tests
   docker-compose up -d && npm run test:integration
   ```

4. **Submit Merge Request**
   - Ensure CI pipeline passes
   - Request review from team members
   - Address feedback and update

## Coding Standards

### Backend (Java/Spring Boot)

**Code Style:**
- Follow Google Java Style Guide
- Use meaningful variable and method names
- Maximum line length: 120 characters
- Use `@Override` annotations
- Organize imports properly

**API Design:**
```java
// Good: RESTful endpoint with proper annotations
@PostMapping("/api/v1/users")
@ResponseStatus(HttpStatus.CREATED)
public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
    // Implementation
}

// Good: Proper exception handling
@ExceptionHandler(ValidationException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ErrorResponse handleValidation(ValidationException ex) {
    return new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
}
```

**Database:**
- Use JPA with proper entity relationships
- Add database indexes for query optimization
- Use transactions appropriately
- Follow naming conventions (snake_case for columns)

### Frontend (React/TypeScript)

**Code Style:**
- Use TypeScript for type safety
- Follow Prettier configuration
- Use functional components with hooks
- Organize files by feature, not by file type

**Component Structure:**
```typescript
// Good: Proper component with types
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="user-card">
      {/* Component content */}
    </div>
  );
};
```

**State Management:**
- Use React Context for global state
- Use `useState` for local component state
- Use `useEffect` appropriately with cleanup

### Infrastructure (Kubernetes/Docker)

**Docker Best Practices:**
```dockerfile
# Good: Multi-stage build with non-root user
FROM maven:3.9-openjdk-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src src
RUN mvn package -DskipTests

FROM openjdk:17-jre-slim
RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

**Kubernetes Manifests:**
- Use resource limits and requests
- Implement proper health checks
- Follow security best practices
- Use Kustomize for environment management

## Testing Requirements

### Unit Tests

**Coverage Requirements:**
- Backend: Minimum 80% code coverage
- Frontend: Minimum 70% code coverage
- Critical paths: 95% coverage required

**Testing Frameworks:**
```java
// Backend: JUnit 5 + Mockito
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void shouldCreateUser() {
        // Test implementation
    }
}
```

```typescript
// Frontend: Jest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

test('should display user information', () => {
  const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
  render(<UserCard user={user} onEdit={jest.fn()} />);

  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### Integration Tests

**Database Tests:**
- Use TestContainers for real database testing
- Test API endpoints end-to-end
- Verify data persistence and retrieval

**API Tests:**
- Test all REST endpoints
- Verify authentication/authorization
- Test error handling scenarios

## Security Guidelines

### Code Security

**Input Validation:**
```java
// Good: Proper validation
@PostMapping("/users")
public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
    // Validation handled by @Valid annotation
    User user = userService.createUser(request);
    return ResponseEntity.ok(user);
}

// Good: SQL injection prevention
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);
```

**Secret Management:**
- Never commit secrets to Git
- Use environment variables or Kubernetes secrets
- Rotate secrets regularly
- Use strong encryption for sensitive data

### Dependencies

**Vulnerability Management:**
- Keep dependencies updated
- Review security advisories
- Use dependency scanning in CI/CD
- Monitor for new vulnerabilities

## Documentation Standards

### Code Documentation

**Javadoc (Backend):**
```java
/**
 * Creates a new user account with the provided information.
 *
 * @param request the user creation request containing user details
 * @return the created user with generated ID
 * @throws ValidationException if the request data is invalid
 * @throws DuplicateEmailException if the email is already registered
 */
public User createUser(CreateUserRequest request) {
    // Implementation
}
```

**JSDoc (Frontend):**
```typescript
/**
 * Renders a user card component with edit functionality
 * @param user - The user object to display
 * @param onEdit - Callback function triggered when edit button is clicked
 * @returns React functional component
 */
export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
    // Implementation
};
```

### API Documentation

- Use OpenAPI/Swagger specifications
- Document all endpoints, parameters, and responses
- Include example requests and responses
- Keep documentation updated with code changes

## Review Process

### Code Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

**Code Quality:**
- [ ] Code follows style guidelines
- [ ] No code duplication
- [ ] Names are clear and descriptive
- [ ] Comments explain why, not what

**Security:**
- [ ] No sensitive information exposed
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] Security best practices followed

**Testing:**
- [ ] Tests cover new functionality
- [ ] Tests are meaningful and thorough
- [ ] Test coverage meets requirements
- [ ] Integration tests updated

### Merge Requirements

**Before Merging:**
- ✅ All CI/CD checks pass
- ✅ Code review approved by 2+ team members
- ✅ Security scan passes (no HIGH/CRITICAL vulnerabilities)
- ✅ Tests pass with required coverage
- ✅ Documentation updated

## CI/CD Pipeline

### Pipeline Stages

| Stage | Purpose | Criteria |
|-------|---------|----------|
| **Validate** | Lint, format check | Must pass |
| **Test** | Unit + Integration tests | 80%+ coverage |
| **Security** | Vulnerability scanning | No HIGH/CRITICAL |
| **Build** | Docker image creation | Successful build |
| **Deploy** | Kubernetes deployment | ArgoCD sync |

### Quality Gates

**Automatic Rejection:**
- Code coverage below minimum requirements
- Security vulnerabilities (HIGH/CRITICAL severity)
- Failed tests or build errors
- Merge conflicts not resolved

## Getting Help

### Resources

- **Documentation**: Check existing docs in `/docs` directory
- **Architecture**: Refer to README.md for system design
- **Security**: See `docs/SECURITY.md` for security guidelines
- **Backup/Recovery**: See `docs/BACKUP_RECOVERY.md` for operational procedures

### Team Contact

- **Technical Questions**: DevOps Team Lead
- **Security Issues**: Security Team (see `docs/SECURITY.md`)
- **Infrastructure**: Infrastructure Team
- **General Help**: Team Slack channel

---

**Remember**: Quality over speed. Take time to write clean, secure, and well-tested code.

**Document Owner**: DevOps Team
**Last Updated**: 2026-03-25
**Next Review**: 2026-06-25