#!/bin/bash

# VibeKraft Infrastructure Setup Script
# Sets up the infrastructure for Replit-like WebVM system

set -e

echo "🚀 Setting up VibeKraft Infrastructure..."

# Configuration
PROJECT_NAME="vibecraft"
REGION="us-central1"
ZONE="us-central1-a"
CLUSTER_NAME="vibecraft-webvm"
NAMESPACE="webvm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Setup Google Cloud Project
setup_gcp_project() {
    echo "Setting up Google Cloud Project..."
    
    # Enable required APIs
    gcloud services enable container.googleapis.com
    gcloud services enable compute.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable cloudresourcemanager.googleapis.com
    
    print_status "Google Cloud APIs enabled"
}

# Create GKE Cluster
create_gke_cluster() {
    echo "Creating GKE cluster..."
    
    # Check if cluster already exists
    if gcloud container clusters describe $CLUSTER_NAME --zone=$ZONE &> /dev/null; then
        print_warning "Cluster $CLUSTER_NAME already exists"
        return
    fi
    
    # Create cluster with preemptible nodes for cost efficiency
    gcloud container clusters create $CLUSTER_NAME \
        --zone=$ZONE \
        --machine-type=n1-highmem-4 \
        --num-nodes=3 \
        --enable-autoscaling \
        --min-nodes=1 \
        --max-nodes=10 \
        --preemptible \
        --enable-autorepair \
        --enable-autoupgrade \
        --disk-size=50GB \
        --disk-type=pd-ssd \
        --enable-network-policy \
        --enable-ip-alias \
        --enable-shielded-nodes
    
    print_status "GKE cluster created"
}

# Configure kubectl
configure_kubectl() {
    echo "Configuring kubectl..."
    
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE
    
    print_status "kubectl configured"
}

# Create Kubernetes namespace
create_namespace() {
    echo "Creating Kubernetes namespace..."
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    print_status "Namespace $NAMESPACE created"
}

# Deploy Redis for session storage
deploy_redis() {
    echo "Deploying Redis..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: $NAMESPACE
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
EOF
    
    print_status "Redis deployed"
}

# Deploy WebSocket server
deploy_websocket_server() {
    echo "Deploying WebSocket server..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-server
  namespace: $NAMESPACE
spec:
  replicas: 3
  selector:
    matchLabels:
      app: websocket-server
  template:
    metadata:
      labels:
        app: websocket-server
    spec:
      containers:
      - name: websocket-server
        image: gcr.io/$PROJECT_NAME/websocket-server:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: MAX_CONTAINERS
          value: "100"
        - name: IDLE_TIMEOUT
          value: "1800000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: websocket-server
  namespace: $NAMESPACE
spec:
  selector:
    app: websocket-server
  ports:
  - port: 8080
    targetPort: 8080
  type: LoadBalancer
EOF
    
    print_status "WebSocket server deployed"
}

# Deploy NGINX load balancer
deploy_load_balancer() {
    echo "Deploying load balancer..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: $NAMESPACE
data:
  nginx.conf: |
    events {
        worker_connections 1024;
    }
    
    http {
        upstream websocket_backend {
            server websocket-server:8080;
        }
        
        map \$http_upgrade \$connection_upgrade {
            default upgrade;
            '' close;
        }
        
        server {
            listen 80;
            
            location /ws {
                proxy_pass http://websocket_backend;
                proxy_http_version 1.1;
                proxy_set_header Upgrade \$http_upgrade;
                proxy_set_header Connection \$connection_upgrade;
                proxy_set_header Host \$host;
                proxy_set_header X-Real-IP \$remote_addr;
                proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto \$scheme;
                proxy_read_timeout 86400;
            }
            
            location /health {
                return 200 'OK';
                add_header Content-Type text/plain;
            }
        }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-lb
  namespace: $NAMESPACE
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-lb
  template:
    metadata:
      labels:
        app: nginx-lb
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
      volumes:
      - name: nginx-config
        configMap:
          name: nginx-config
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
  namespace: $NAMESPACE
spec:
  selector:
    app: nginx-lb
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
EOF
    
    print_status "Load balancer deployed"
}

# Setup monitoring
setup_monitoring() {
    echo "Setting up monitoring..."
    
    # Deploy Prometheus
    kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
    
    print_status "Monitoring setup completed"
}

# Main execution
main() {
    echo "🎯 Starting VibeKraft Infrastructure Setup"
    echo "Project: $PROJECT_NAME"
    echo "Region: $REGION"
    echo "Cluster: $CLUSTER_NAME"
    echo ""
    
    check_prerequisites
    setup_gcp_project
    create_gke_cluster
    configure_kubectl
    create_namespace
    deploy_redis
    # deploy_websocket_server  # Uncomment when Docker image is ready
    deploy_load_balancer
    setup_monitoring
    
    echo ""
    print_status "Infrastructure setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Build and push WebSocket server Docker image"
    echo "2. Update DNS to point to load balancer IP"
    echo "3. Configure SSL certificates"
    echo "4. Deploy your Next.js application"
    echo ""
    echo "Get load balancer IP:"
    echo "kubectl get service nginx-lb -n $NAMESPACE"
}

# Run main function
main "$@"
