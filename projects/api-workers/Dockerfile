# syntax=docker/dockerfile:1

FROM base AS production
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY ./api-workers ./projects/api-workers
COPY ./schema ./projects/schema
COPY ./api-schema ./projects/api-schema

RUN pnpm install --frozen-lockfile
RUN pnpm -r build

RUN chown -R node:node /app/projects/api-workers
USER node

EXPOSE 3000
CMD ["pnpm", "--filter=@lag.meepen.dev/api-workers", "start:prod", "--persist-to", "/tmp", "--port", "3000", "--ip", "0.0.0.0"]
