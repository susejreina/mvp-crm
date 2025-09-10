# syntax=docker.io/docker/dockerfile:1

FROM --platform=linux/amd64 node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# --- Dependencies Stage ---
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies with retry logic
RUN yarn install --frozen-lockfile --network-timeout 300000

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Define build arguments for environment variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG SEED_ADMIN_EMAIL
ARG SEED_ADMIN_PASSWORD
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV SEED_ADMIN_EMAIL=$SEED_ADMIN_EMAIL
ENV SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY

# Create .env.production file from build arguments with defaults
RUN echo "NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-}" > .env.production && \
    echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}" >> .env.production && \
    echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}" >> .env.production && \
    echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-}" >> .env.production && \
    echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}" >> .env.production && \
    echo "NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID:-}" >> .env.production && \
    echo "SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-}" >> .env.production && \
    echo "SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD:-}" >> .env.production && \
    echo "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-}" >> .env.production && \
    echo "FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL:-}" >> .env.production && \
    echo "FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY:-}" >> .env.production

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production environment file
COPY --from=builder --chown=nextjs:nodejs /app/.env.production ./.env.production

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]