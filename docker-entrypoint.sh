#!/bin/sh
set -e

echo "[start] Czekam na baze danych..."

# Baza bywa gotowa kilka sekund po kontenerze aplikacji. Bez tej petli
# pierwszy start po restarcie serwera potrafi sie wywalic bez powodu.
PROBA=0
until npx prisma db execute --stdin <<'KONIEC' 2>/dev/null
SELECT 1;
KONIEC
do
  PROBA=$((PROBA+1))
  if [ "$PROBA" -ge 12 ]; then
    echo "[start] Baza nieosiagalna po 12 probach. Przerywam."
    exit 1
  fi
  echo "[start] Baza jeszcze nie odpowiada. Proba $PROBA z 12, czekam 5 s..."
  sleep 5
done

echo "[start] Baza odpowiada. Synchronizuje schemat..."

# Dwie sciezki, bo projekt moze byc na jednym z dwoch etapow:
#
# 1. Sa wygenerowane migracje (katalog prisma/migrations) — uzywamy ich,
#    bo daja historie zmian i przewidywalnosc na produkcji.
# 2. Migracji jeszcze nie ma — pierwsze wdrozenie. Wtedy "db push"
#    tworzy tabele wprost ze schematu. Bez tego pierwszy start zawsze
#    konczy sie bledem "No migration found in prisma/migrations".
#
# Gdy dojdzie pierwsza migracja, ta sama komenda przelaczy sie sama.
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[start] Znaleziono migracje. Wykonuje migrate deploy."
  npx prisma migrate deploy
else
  echo "[start] Brak migracji. Synchronizuje schemat przez db push."
  npx prisma db push --skip-generate --accept-data-loss
fi

echo "[start] Schemat gotowy. Uruchamiam aplikacje."
exec "$@"
