# syntax=docker/dockerfile:1

FROM base AS builder
COPY . ./projects

RUN pnpm install --frozen-lockfile

RUN --mount=type=secret,id=vite_env \
    set -a; . /run/secrets/vite_env; set +a; pnpm --filter=@lag.meepen.dev/frontend --filter=@lag.meepen.dev/api-schema build

FROM builder AS production
RUN npm install -g serve

USER node
WORKDIR /app/projects/frontend/project
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
