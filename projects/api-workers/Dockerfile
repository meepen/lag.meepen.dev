# syntax=docker/dockerfile:1

FROM lag.meepen.dev.localhost/base AS production

ENTRYPOINT ["pnpm", "run", "--filter=@lag.meepen.dev/api-workers", "start"]
