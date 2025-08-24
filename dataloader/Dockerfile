
FROM alpine:3.20

# Install runtime dependencies
RUN apk add --no-cache \
    mtr \
    curl

WORKDIR /app
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
