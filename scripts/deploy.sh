#!/bin/bash

# VibeKraft Deployment Script
# Production deployment script for AWS Lightsail

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Default values
ENVIRONMENT="production"
SKIP_BACKUP=false
SKIP_TESTS=false
FORCE_REBUILD=false
DRY_RUN=false

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy VibeKraft to production environment

OPTIONS:
    -e, --environment ENV    Deployment environment (default: production)
    -s, --skip-backup       Skip database backup
    -t, --skip-tests        Skip running tests
    -f, --force-rebuild     Force rebuild of Docker images
    -d, --dry-run          Show what would be done without executing
    -h, --help             Show this help message

EXAMPLES:
    $0                      # Deploy to production
    $0 -e staging          # Deploy to staging
    $0 -f                  # Force rebuild and deploy
    $0 -d                  # Dry run (show commands only)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -f|--force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
fi

# Set environment-specific variables
case $ENVIRONMENT in
    development)
        DOCKER_COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env.local"
        ;;
    staging)
        DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
        ENV_FILE=".env.staging"
        ;;
    production)
        DOCKER_COMPOSE_FILE="docker-compose.production.yml"
        ENV_FILE=".env.production"
        ;;
esac

# Change to project root
cd "$PROJECT_ROOT"

log "Starting deployment to $ENVIRONMENT environment"

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "docker-compose is not installed. Please install it and try again."
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please create it and try again."
    fi
    
    # Check if docker-compose file exists
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error "Docker compose file $DOCKER_COMPOSE_FILE not found."
    fi
    
    success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests"
        return
    fi
    
    log "Running tests..."
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would run: npm test"
        return
    fi
    
    if ! npm test; then
        error "Tests failed. Deployment aborted."
    fi
    
    success "Tests passed"
}

# Backup database
backup_database() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warning "Skipping database backup"
        return
    fi
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        warning "Skipping backup for development environment"
        return
    fi
    
    log "Creating database backup..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would create backup: $backup_file"
        return
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    # Create database backup
    if docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_dump -U vibekraft vibekraft > "backups/$backup_file"; then
        success "Database backup created: backups/$backup_file"
    else
        error "Failed to create database backup"
    fi
}

# Build and deploy
deploy() {
    log "Building and deploying application..."
    
    local build_args=""
    if [[ "$FORCE_REBUILD" == true ]]; then
        build_args="--build --force-recreate"
        log "Force rebuilding Docker images..."
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would run: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d $build_args"
        return
    fi
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Build and start services
    log "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d $build_args
    
    success "Services started successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would run: docker-compose exec vibekraft-web npx prisma migrate deploy"
        return
    fi
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    if docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T vibekraft-web npx prisma migrate deploy; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would run health check"
        return
    fi
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T vibekraft-web node scripts/healthcheck.js; then
            success "Health check passed"
            return
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health check failed after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would run: docker image prune -f"
        return
    fi
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        docker volume prune -f
    fi
    
    success "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Deployment status:"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Would show service status"
        return
    fi
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    log "Application URLs:"
    echo "  🌐 Web App: https://$(grep DOMAIN "$ENV_FILE" | cut -d'=' -f2)"
    echo "  📊 Grafana: https://grafana.$(grep DOMAIN "$ENV_FILE" | cut -d'=' -f2)"
    echo "  📈 Prometheus: https://metrics.$(grep DOMAIN "$ENV_FILE" | cut -d'=' -f2)"
    echo "  💾 MinIO: https://storage.$(grep DOMAIN "$ENV_FILE" | cut -d'=' -f2)"
}

# Main deployment flow
main() {
    log "🚀 VibeKraft Deployment Script"
    log "Environment: $ENVIRONMENT"
    log "Docker Compose File: $DOCKER_COMPOSE_FILE"
    log "Environment File: $ENV_FILE"
    
    if [[ "$DRY_RUN" == true ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    check_prerequisites
    run_tests
    backup_database
    deploy
    run_migrations
    health_check
    cleanup
    show_status
    
    success "🎉 Deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "📝 Post-deployment checklist:"
        echo "  ✅ Verify all services are running"
        echo "  ✅ Check application logs for errors"
        echo "  ✅ Test critical user flows"
        echo "  ✅ Monitor system metrics"
        echo "  ✅ Verify SSL certificates"
    fi
}

# Trap errors and cleanup
trap 'error "Deployment failed. Check the logs above for details."' ERR

# Run main function
main "$@"
