# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install curl for health checks and build dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source files
COPY . .

# Build the app for production
RUN --mount=type=secret,id=vite_env \
    set -a; . /run/secrets/vite_env; set +a; npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /home/node/app

# Install curl for health checks and serve package for static serving
RUN apk add --no-cache curl && \
    npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Use the built-in node user
USER node

# Expose port
EXPOSE 3000

# Run the app using serve
CMD ["serve", "-s", "dist", "-l", "3000"]
