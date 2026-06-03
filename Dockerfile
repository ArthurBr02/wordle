FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build.ts

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/data ./data
COPY package.json bunfig.toml tsconfig.json ./

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "src/index.ts"]
