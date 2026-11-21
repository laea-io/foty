FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# 빌드 때는 DB에 붙지 않는다(페이지를 정적으로 만들 때 env 검사만 통과시키는 값).
ENV DATABASE_URL=postgres://build:build@127.0.0.1:1/build MIGRATE_ON_START=0
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
# 알파인 보안 업데이트 + 런타임에 안 쓰는 npm·corepack 제거(2026-11-03 취약점 정리와 같은 방식)
RUN apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=4060 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
USER node
EXPOSE 4060
# robots.txt — DB를 부르지 않는 가벼운 경로라 web 프로세스가 살아 있는지만 본다(DB까지는 /api/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:4060/robots.txt || exit 1
CMD ["node", "server.js"]
