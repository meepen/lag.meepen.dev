# syntax=docker/dockerfile:1

FROM lag.meepen.dev.localhost/base AS deployment
RUN pnpm --filter=@lag.meepen.dev/migrations deploy /app/dist

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deployment /app/dist /app

# Each file that uses this base image should update ENTRYPOINT as needed.
ENTRYPOINT ["npm", "run", "start"]
