# syntax=docker/dockerfile:1

FROM base AS production
COPY ./schema ./projects/schema
COPY ./migrations ./projects/migrations
RUN pnpm install --frozen-lockfile
RUN pnpm -r build

USER node
EXPOSE 3000
CMD ["pnpm", "--filter=@lag.meepen.dev/migrations", "start"]