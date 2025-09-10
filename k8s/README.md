# Sistema Ventas Kubernetes Deployment

This directory contains the Kubernetes manifests for deploying the Sistema Ventas application.

## Manifests

- `deployment.yaml` - Main application deployment with ECR integration and imagePullPolicy Always
- `service.yaml` - ClusterIP service to expose the application internally
- `ingress.yaml` - Ingress with TLS for sistema-ventas.academiadeia.com

## Prerequisites

1. The `ecr-creds` secret must exist in the `academiadeia` namespace for pulling images from ECR
2. cert-manager must be configured with the `letsencrypt-dns` cluster issuer
3. The ECR repository `admin-ventas` must exist and contain the application image

## Manual Deployment

To deploy manually:

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get deployment sistema-ventas-deployment -n academiadeia
kubectl get service sistema-ventas-service -n academiadeia
kubectl get ingress sistema-ventas-ingress -n academiadeia

# Check pods
kubectl get pods -n academiadeia -l app=sistema-ventas

# View logs
kubectl logs -n academiadeia -l app=sistema-ventas -f
```

## Automated Deployment

The GitHub Actions workflow automatically:
1. Builds and pushes the Docker image to ECR
2. Updates the deployment with the new image
3. Restarts the deployment to ensure the new image is pulled
4. Waits for the rollout to complete

## Configuration

The deployment is configured to:
- Use ECR image with `imagePullPolicy: Always`
- Run on port 3000 internally, exposed via service on port 80
- Include health checks on `/api/health`
- Use the shared `ecr-creds` secret for image pulling
- Serve traffic on `sistema-ventas.academiadeia.com` with automatic TLS

## Environment Variables

Runtime environment variables are injected via Docker build arguments in the GitHub Actions workflow. See `.github/workflows/deploy.yml` for the complete list of secrets and variables used.
