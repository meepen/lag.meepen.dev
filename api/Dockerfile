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

# Install Nest CLI globally
RUN npm install -g @nestjs/cli

# Copy source files
COPY . .

# Build the app using tsconfig.build.json
RUN nest build

# Production stage
FROM node:22-alpine AS production
WORKDIR /home/node/app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Use the built-in node user
USER node

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "dist/main.js"]
