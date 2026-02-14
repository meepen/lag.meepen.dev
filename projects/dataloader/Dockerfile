
FROM lag.meepen.dev.localhost/base AS deployment
RUN pnpm --filter=@lag.meepen.dev/dataloader deploy /app/dist

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache mtr
COPY --from=deployment /app/dist /app

ENTRYPOINT ["npm", "run", "start"]
