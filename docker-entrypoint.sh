#!/bin/sh
set -e

echo "[start] Synchronizuje schemat bazy danych..."

# Bledow NIE ukrywamy. Poprzednia wersja przekierowywala je do /dev/null
# i kazdy problem wygladal tak samo: "baza nieosiagalna". Przy awarii
# chcemy widziec, co naprawde sie stalo.
#
# Dwie sciezki, bo projekt moze byc na jednym z dwoch etapow:
#  1. Sa migracje w prisma/migrations — uzywamy ich, bo daja historie zmian.
#  2. Migracji jeszcze nie ma (pierwsze wdrozenie) — "db push" tworzy
#     tabele wprost ze schematu.
# Gdy pojawi sie pierwsza migracja, skrypt przelaczy sie sam.

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  KOMENDA="npx prisma migrate deploy"
else
  KOMENDA="npx prisma db push --skip-generate --accept-data-loss"
fi

PROBA=1
until $KOMENDA; do
  if [ "$PROBA" -ge 10 ]; then
    echo "[start] Nie udalo sie po 10 probach. Przerywam — zobacz blad powyzej."
    exit 1
  fi
  echo "[start] Proba $PROBA z 10 nieudana. Czekam 5 s i ponawiam..."
  PROBA=$((PROBA+1))
  sleep 5
done

echo "[start] Schemat gotowy. Uruchamiam aplikacje."
exec "$@"
