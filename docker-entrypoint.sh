#!/bin/sh
set -e

echo "[start] Sprawdzam polaczenie z baza danych..."

# Baza bywa gotowa kilka sekund po kontenerze aplikacji. Bez tej petli
# pierwszy start po restarcie serwera potrafi sie wywalic bez powodu.
PROBA=0
until npx prisma migrate deploy 2>&1; do
  PROBA=$((PROBA+1))
  if [ "$PROBA" -ge 10 ]; then
    echo "[start] Baza nieosiagalna po 10 probach. Przerywam."
    exit 1
  fi
  echo "[start] Baza jeszcze nie odpowiada. Proba $PROBA z 10, czekam 5 s..."
  sleep 5
done

echo "[start] Migracje wykonane. Uruchamiam aplikacje."
exec "$@"
