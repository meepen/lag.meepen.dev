# syntax=docker/dockerfile:1

FROM base AS builder
COPY ./frontend ./projects/frontend
COPY ./api-schema ./projects/api-schema

RUN pnpm install --frozen-lockfile

RUN --mount=type=secret,id=vite_env \
    set -a; . /run/secrets/vite_env; set +a; pnpm -r build

FROM builder AS production
RUN npm install -g serve

USER node
WORKDIR /app/projects/frontend/project
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
