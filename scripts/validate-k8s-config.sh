#!/bin/bash
# Kubernetes Configuration Validation Script
# Validates YAML syntax, security policies, and best practices

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Validation functions
validate_yaml_syntax() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if ! kubectl --dry-run=client apply -f "$file" &>/dev/null; then
        echo -e "${RED}❌ YAML Syntax Error: $file${NC}"
        kubectl --dry-run=client apply -f "$file" 2>&1 | head -5
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    else
        echo -e "${GREEN}✅ Valid YAML: $file${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    fi
}

check_resource_limits() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "kind: Deployment" "$file"; then
        if ! grep -A 20 "kind: Deployment" "$file" | grep -q "resources:" || \
           ! grep -A 20 "resources:" "$file" | grep -q "limits:"; then
            echo -e "${YELLOW}⚠️  Missing Resource Limits: $file${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            return 1
        else
            echo -e "${GREEN}✅ Resource Limits Found: $file${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        fi
    else
        echo -e "${BLUE}ℹ️  Skipping (Not a Deployment): $file${NC}"
        return 0
    fi
}

check_security_context() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "kind: Deployment" "$file"; then
        if ! grep -A 30 "kind: Deployment" "$file" | grep -q "securityContext:"; then
            echo -e "${YELLOW}⚠️  Missing Security Context: $file${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            return 1
        else
            echo -e "${GREEN}✅ Security Context Found: $file${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        fi
    else
        echo -e "${BLUE}ℹ️  Skipping (Not a Deployment): $file${NC}"
        return 0
    fi
}

check_health_probes() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "kind: Deployment" "$file"; then
        local has_liveness=$(grep -A 50 "kind: Deployment" "$file" | grep -c "livenessProbe:" || echo "0")
        local has_readiness=$(grep -A 50 "kind: Deployment" "$file" | grep -c "readinessProbe:" || echo "0")

        if [[ $has_liveness -eq 0 ]] || [[ $has_readiness -eq 0 ]]; then
            echo -e "${YELLOW}⚠️  Missing Health Probes: $file (liveness: $has_liveness, readiness: $has_readiness)${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            return 1
        else
            echo -e "${GREEN}✅ Health Probes Found: $file${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        fi
    else
        echo -e "${BLUE}ℹ️  Skipping (Not a Deployment): $file${NC}"
        return 0
    fi
}

check_labels() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    local required_labels=("app.kubernetes.io/name" "app.kubernetes.io/part-of")
    local missing_labels=()

    for label in "${required_labels[@]}"; do
        if ! grep -q "$label:" "$file"; then
            missing_labels+=("$label")
        fi
    done

    if [[ ${#missing_labels[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Missing Required Labels: $file (${missing_labels[*]})${NC}"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return 1
    else
        echo -e "${GREEN}✅ Required Labels Found: $file${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    fi
}

check_secrets_security() {
    local file="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "kind: Secret" "$file"; then
        # Check for base64 encoded secrets (they should be)
        if grep -A 10 "data:" "$file" | grep -E ": [A-Za-z0-9+/=]+$" > /dev/null; then
            echo -e "${GREEN}✅ Secrets Properly Encoded: $file${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        elif grep -A 10 "stringData:" "$file" > /dev/null; then
            echo -e "${YELLOW}⚠️  Secret Uses StringData (consider base64): $file${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            return 1
        else
            echo -e "${RED}❌ Secret Format Issue: $file${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${BLUE}ℹ️  Skipping (Not a Secret): $file${NC}"
        return 0
    fi
}

validate_kustomization() {
    local dir="$1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [[ -f "$dir/kustomization.yaml" ]]; then
        echo -e "${BLUE}🔍 Testing Kustomization: $dir${NC}"
        if kubectl kustomize "$dir" > /tmp/kustomization_output.yaml 2>/dev/null; then
            echo -e "${GREEN}✅ Kustomization Valid: $dir${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))

            # Validate the generated output
            if kubectl --dry-run=client apply -f /tmp/kustomization_output.yaml &>/dev/null; then
                echo -e "${GREEN}✅ Generated Resources Valid: $dir${NC}"
            else
                echo -e "${RED}❌ Generated Resources Invalid: $dir${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi

            rm -f /tmp/kustomization_output.yaml
            return 0
        else
            echo -e "${RED}❌ Kustomization Invalid: $dir${NC}"
            kubectl kustomize "$dir" 2>&1 | head -5
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${BLUE}ℹ️  No kustomization.yaml in: $dir${NC}"
        return 0
    fi
}

check_network_policies() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [[ -f "k8s/base/network-policies.yaml" ]]; then
        echo -e "${GREEN}✅ Network Policies Found${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  Network Policies Missing${NC}"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

check_pod_security_standards() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [[ -f "k8s/base/pod-security.yaml" ]]; then
        echo -e "${GREEN}✅ Pod Security Standards Found${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  Pod Security Standards Missing${NC}"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Main validation function
main() {
    echo "==========================================="
    echo "🔍 Kubernetes Configuration Validation"
    echo "==========================================="
    echo "Timestamp: $(date)"
    echo ""

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl not found. Please install kubectl.${NC}"
        exit 1
    fi

    echo -e "${BLUE}📋 Validating YAML Syntax...${NC}"
    echo "-------------------------------------------"

    # Find all YAML files in k8s directory
    while IFS= read -r -d '' file; do
        echo "Checking: $file"
        validate_yaml_syntax "$file"
        echo ""
    done < <(find k8s -name "*.yaml" -type f -print0 2>/dev/null || true)

    # Find all YAML files in argocd directory
    while IFS= read -r -d '' file; do
        echo "Checking: $file"
        validate_yaml_syntax "$file"
        echo ""
    done < <(find argocd -name "*.yaml" -type f -print0 2>/dev/null || true)

    echo -e "${BLUE}🛡️  Validating Security Best Practices...${NC}"
    echo "-------------------------------------------"

    # Check deployments for security best practices
    while IFS= read -r -d '' file; do
        if grep -q "kind: Deployment" "$file"; then
            echo "Security Check: $file"
            check_resource_limits "$file"
            check_security_context "$file"
            check_health_probes "$file"
            check_labels "$file"
            echo ""
        fi
    done < <(find k8s -name "*.yaml" -type f -print0 2>/dev/null || true)

    # Check secrets
    while IFS= read -r -d '' file; do
        if grep -q "kind: Secret" "$file"; then
            echo "Secret Check: $file"
            check_secrets_security "$file"
            echo ""
        fi
    done < <(find k8s argocd -name "*.yaml" -type f -print0 2>/dev/null || true)

    echo -e "${BLUE}📦 Validating Kustomizations...${NC}"
    echo "-------------------------------------------"

    validate_kustomization "k8s/base"
    validate_kustomization "k8s/overlays/dev"
    validate_kustomization "k8s/monitoring"
    echo ""

    echo -e "${BLUE}🔐 Checking Security Policies...${NC}"
    echo "-------------------------------------------"

    check_network_policies
    check_pod_security_standards
    echo ""

    # Summary
    echo "==========================================="
    echo "📊 Validation Summary"
    echo "==========================================="
    echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNING_CHECKS${NC}"
    echo ""

    # Calculate percentage
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        local pass_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
        echo -e "Pass Rate: ${GREEN}${pass_rate}%${NC}"
    fi

    echo ""

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "${GREEN}🎉 All critical checks passed!${NC}"
        if [[ $WARNING_CHECKS -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  Please review warnings for best practices.${NC}"
        fi
        exit 0
    else
        echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"