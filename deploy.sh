#!/usr/bin/env bash
# IS373 Automated Deployment Script
# Usage: ./deploy.sh <qa|production> <image_tag> [commit_sha] [version]

set -euo pipefail

TARGET_ENV="${1:-qa}"
IMAGE_TAG="${2:-latest}"
COMMIT_SHA="${3:-manual}"
VERSION="${4:-1.0.0}"
DEPLOY_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "===================================================="
echo "?? Starting Deployment: [${TARGET_ENV^^}]"
echo "Image Tag: ${IMAGE_TAG}"
echo "Commit:    ${COMMIT_SHA}"
echo "Version:   ${VERSION}"
echo "Time:      ${DEPLOY_TIME}"
echo "===================================================="

cd /opt/is373-app

# Pull the latest image
echo "?? Pulling image: ${IMAGE_TAG}..."
docker pull "${IMAGE_TAG}"

if [ "${TARGET_ENV}" = "qa" ]; then
    export QA_IMAGE="${IMAGE_TAG}"
    export QA_COMMIT="${COMMIT_SHA}"
    export QA_VERSION="${VERSION}"
    export QA_DEPLOY_TIME="${DEPLOY_TIME}"
    SERVICE="web-qa"
    CONTAINER="is373-qa"
else
    export PROD_IMAGE="${IMAGE_TAG}"
    export PROD_COMMIT="${COMMIT_SHA}"
    export PROD_VERSION="${VERSION}"
    export PROD_DEPLOY_TIME="${DEPLOY_TIME}"
    SERVICE="web-prod"
    CONTAINER="is373-prod"
fi

# Bring up the updated service
echo "?? Updating service: ${SERVICE}..."
docker compose -f docker-compose.yml up -d --no-deps "${SERVICE}"

# Wait and verify health
echo "?? Verifying container health..."
sleep 3

if docker ps --filter "name=${CONTAINER}" --filter "status=running" | grep -q "${CONTAINER}"; then
    echo "? Container ${CONTAINER} is running!"
    docker ps --filter "name=${CONTAINER}" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
else
    echo "? Deployment failed: ${CONTAINER} is not running!"
    docker logs "${CONTAINER}" --tail 50
    exit 1
fi

echo "?? Deployment to ${TARGET_ENV} completed successfully!"
