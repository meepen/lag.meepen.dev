# syntax=docker/dockerfile:1

FROM base AS builder
COPY ./api-workers ./projects/api-workers
COPY ./schema ./projects/schema
RUN pnpm install --frozen-lockfile
RUN pnpm -r build

FROM builder AS production
RUN pnpm install --production --frozen-lockfile

USER node
WORKDIR /app/projects/api-workers/project

EXPOSE 3000
CMD ["node", "dist/main.js"]
