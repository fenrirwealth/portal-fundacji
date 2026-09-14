# ------------------------------------------------------------
#  Portal Fundacji — obraz produkcyjny
#
#  Dlaczego Dockerfile, a nie Nixpacks: Nixpacks nie obsluguje poprawnie
#  Prismy, a kontener budujacy nie widzi sieci bazy — migracja w fazie
#  build konczy sie bledem P1001. Migracje robimy przy starcie kontenera.
# ------------------------------------------------------------

FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
WORKDIR /app
# npm ci, nie npm install: instaluje dokladnie wersje z package-lock.json.
# Bez tego kazdy build moglby wciagnac inna wersje zaleznosci, a przy
# next-auth w becie to realne ryzyko, nie teoria.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pelne node_modules swiadomie: wczesniej kopiowalem tylko katalogi
# "prisma" i "@prisma", przez co narzedzie Prismy nie mialo zaleznosci,
# wywalalo sie przy starcie, a skrypt raportowal to jako "baza
# nieosiagalna" — komunikat mylacy, bo baza dzialala.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Coolify moze korzystac z tego samego punktu kontrolnego. Start-period
# obejmuje oczekiwanie na PostgreSQL i wykonanie migracji przy pierwszym
# uruchomieniu kontenera. Dluzszy okres startowy obejmuje rowniez
# pierwszy cold start i pobranie silnika Prisma.
HEALTHCHECK --interval=30s --timeout=5s --start-period=240s --retries=5 \
  CMD wget -q -O - http://127.0.0.1:3000/api/zdrowie >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
