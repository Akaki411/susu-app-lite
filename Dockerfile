FROM oven/bun:1-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg libfontconfig1 \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

COPY package.json bun.lock ./
COPY scripts ./scripts
RUN bun install --frozen-lockfile

COPY . .
ENV IS_DEV=false
RUN bun run build

FROM base AS runtime

RUN useradd --create-home --shell /usr/sbin/nologin susu

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/index.html ./index.html

RUN mkdir -p /app/data && chown -R susu:susu /app
USER susu

ENV IS_DEV=false
EXPOSE 6767

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-6767}/" || exit 1

CMD ["bun", "run", "start"]
