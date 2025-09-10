#!/bin/bash

# Script to set up GitHub repository secrets and variables from .env.local
# Usage: ./setup-github-secrets.sh

set -e

echo "Setting up GitHub repository secrets and variables..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub CLI first:"
    echo "gh auth login"
    exit 1
fi

# Load environment variables from .env.local
if [ ! -f .env.local ]; then
    echo ".env.local file not found!"
    exit 1
fi

# Source the .env.local file
set -a
source .env.local
set +a

# Repository name (update if different)
REPO="AcademiaDeIA/sistema_interno_ventas"

echo "Setting up secrets for repository: $REPO"

# Set GitHub Actions Variables (public values)
echo "Setting up GitHub Variables..."
gh variable set NEXT_PUBLIC_FIREBASE_API_KEY --body "$NEXT_PUBLIC_FIREBASE_API_KEY" --repo $REPO
gh variable set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" --repo $REPO
gh variable set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" --repo $REPO

# Set GitHub Actions Secrets (sensitive values)
echo "Setting up GitHub Secrets..."
gh secret set FIREBASE_ADMIN_PROJECT_ID --body "$FIREBASE_PROJECT_ID" --repo $REPO
gh secret set FIREBASE_ADMIN_CLIENT_EMAIL --body "$FIREBASE_CLIENT_EMAIL" --repo $REPO
gh secret set FIREBASE_ADMIN_PRIVATE_KEY --body "$FIREBASE_PRIVATE_KEY" --repo $REPO

# AWS and Kubernetes secrets (you'll need to provide these)
echo ""
echo "⚠️  The following secrets need to be set manually (not in .env.local):"
echo ""
echo "AWS Secrets:"
echo "  gh secret set AWS_ACCESS_KEY_ID --body 'YOUR_AWS_ACCESS_KEY' --repo $REPO"
echo "  gh secret set AWS_SECRET_ACCESS_KEY --body 'YOUR_AWS_SECRET_KEY' --repo $REPO"
echo "  gh secret set AWS_REGION --body 'us-east-1' --repo $REPO"
echo ""
echo "Kubernetes Secret:"
echo "  # First, get your kubeconfig and base64 encode it:"
echo "  cat ~/.kube/config | base64 | pbcopy"
echo "  # Then set it:"
echo "  gh secret set K3S_KUBECONFIG_DATA --body 'PASTE_BASE64_KUBECONFIG' --repo $REPO"
echo ""
echo "✅ Firebase secrets and variables have been set!"
echo "⚠️  Don't forget to set the AWS and Kubernetes secrets listed above."