# syntax=docker/dockerfile:1

FROM node:22-alpine
ENV CI=true
RUN corepack enable
RUN corepack prepare pnpm@^10.26.1 --activate

WORKDIR /app
USER root

COPY --from=root-config /out/pnpm-lock.yaml .
COPY --from=root-config /out/pnpm-workspace.yaml .
RUN pnpm install --filter=lag.meepen.dev --frozen-lockfile

RUN mkdir -p projects

# Each file that uses this base image should then copy its code and any dependencies
# For example:
# COPY ./projects/api ./projects/api
# COPY ./projects/shared ./projects/shared
# RUN pnpm install --filter=lag.meepen.dev --frozen-lockfile