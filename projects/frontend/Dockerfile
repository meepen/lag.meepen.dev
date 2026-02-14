# syntax=docker/dockerfile:1

FROM lag.meepen.dev.localhost/base AS deployment
RUN pnpm --filter=@lag.meepen.dev/frontend deploy /app/dist

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deployment /app/dist /app
RUN npm install -g serve

# Each file that uses this base image should update ENTRYPOINT as needed.
ENTRYPOINT ["npx", "serve", "dist"]
