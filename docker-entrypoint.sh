#!/bin/sh
set -e

echo "[start] Przygotowuje schemat bazy danych..."

# Bledow NIE ukrywamy. Wczesniejsza wersja przekierowywala je do /dev/null
# i kazdy problem wygladal tak samo: "baza nieosiagalna".

MIGRACJE_SA=0
if [ -d "prisma/migrations" ] && ls prisma/migrations/*/migration.sql >/dev/null 2>&1; then
  MIGRACJE_SA=1
fi

uruchom() {
  if [ "$MIGRACJE_SA" = "1" ]; then
    # Sciezka produkcyjna. Migracje daja historie zmian i nie wykonuja
    # niczego, czego nie zapisano wprost w pliku SQL.
    if npx prisma migrate deploy; then
      return 0
    fi

    # P3005: baza ma juz tabele, ale nie ma tabeli historii migracji.
    # Tak wyglada baza zalozona wczesniej przez "db push". Oznaczamy
    # pierwsza migracje jako wykonana i ponawiamy. Robi sie to raz.
    echo "[start] Baza wyglada na zalozona przed migracjami. Ustawiam punkt odniesienia."
    PIERWSZA=$(ls prisma/migrations | grep -v migration_lock.toml | sort | head -n 1)
    if [ -n "$PIERWSZA" ]; then
      npx prisma migrate resolve --applied "$PIERWSZA" || return 1
      npx prisma migrate deploy || return 1
      return 0
    fi
    return 1
  else
    # Sciezka wylacznie rozwojowa. Swiadomie BEZ --accept-data-loss:
    # bez tej flagi Prisma odmawia operacji grozacej utrata danych
    # zamiast wykonac ja po cichu.
    npx prisma db push --skip-generate
  fi
}

PROBA=1
until uruchom; do
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
