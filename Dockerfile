# VibeKraft Production Dockerfile
# Multi-stage build for optimized production deployment

# =============================================================================
# DEPENDENCIES STAGE
# =============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
  else \
    npm run build; \
  fi

# =============================================================================
# RUNNER STAGE
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

# Copy infrastructure services
COPY --from=builder --chown=nextjs:nodejs /app/lib/infrastructure ./lib/infrastructure
COPY --from=builder --chown=nextjs:nodejs /app/lib/config ./lib/config
COPY --from=builder --chown=nextjs:nodejs /app/lib/auth ./lib/auth

# Health check script
COPY --chown=nextjs:nodejs scripts/healthcheck.js ./scripts/healthcheck.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# =============================================================================
# DEVELOPMENT STAGE (optional)
# =============================================================================
FROM node:20-alpine AS development
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install; \
  else \
    npm install; \
  fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm dev; \
  else \
    npm run dev; \
  fi
