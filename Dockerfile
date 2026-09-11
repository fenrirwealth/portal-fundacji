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
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

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

# Wynik trybu standalone: serwer z wbudowanymi zaleznosciami aplikacji.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pelne node_modules sa tu potrzebne SWIADOMIE.
#
# Wczesniej kopiowalem tylko katalogi "prisma" i "@prisma", zeby obraz byl
# mniejszy. Efekt: narzedzie wiersza polecen Prismy nie mialo swoich
# zaleznosci, wywalalo sie przy starcie, a skrypt raportowal to jako
# "baza nieosiagalna" — komunikat mylacy, bo baza dzialala.
#
# Obraz rosnie o kilkaset megabajtow. Przy 100 GB dysku to nie problem,
# a start kontenera staje sie przewidywalny.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
