# ──────────────────────────────────────────────
# Multi-stage Dockerfile for Backend API
# ──────────────────────────────────────────────

# Stage 1: Install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --only=production

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source code
COPY Backend/ ./

# Set environment defaults (overridable at runtime)
ENV NODE_ENV=production
ENV PORT=5000

# Expose the backend port
EXPOSE 5000

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/auth || exit 1

# Start the application
CMD ["node", "server.js"]
