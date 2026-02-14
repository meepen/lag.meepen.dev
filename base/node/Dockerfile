# syntax=docker/dockerfile:1

FROM node:24-alpine
ENV CI=true
ENV BUILDKIT_PROGRESS=plain
RUN corepack enable
RUN corepack prepare pnpm@^10.26.1 --activate

WORKDIR /app
ENV PNPM_STORE_PATH=~/.pnpm-store

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN --mount=type=cache,target=~/.pnpm-store pnpm fetch
COPY . .

RUN --mount=type=cache,target=~/.pnpm-store pnpm install --offline --frozen-lockfile

RUN --mount=type=cache,target=~/.pnpm-store \
    --mount=type=secret,id=env \
    set -a; . /run/secrets/env; set +a; pnpm -r build

# FROM lag.meepen.dev.localhost/base AS deployment
# RUN pnpm --filter=@meepen/poe-accountant-background-processor deploy /app/dist

# FROM node:24-alpine AS production
# ENV NODE_ENV=production
# WORKDIR /app
# COPY --from=deployment /app/dist /app

# # Each file that uses this base image should update ENTRYPOINT as needed.
# ENTRYPOINT ["npm", "run", "start"]
