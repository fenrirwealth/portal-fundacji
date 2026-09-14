#!/bin/sh
set -e

echo "[start] Wykonuje migracje bazy danych..."

# Bledow NIE ukrywamy i NIE obchodzimy.
#
# Wczesniejsza wersja po dowolnym niepowodzeniu "migrate deploy"
# oznaczala pierwsza migracje jako wykonana (migrate resolve --applied).
# To bylo niebezpieczne: kazdy blad — takze prawdziwy blad w SQL —
# konczyl sie uznaniem migracji za zastosowana i uruchomieniem
# aplikacji na niekompletnym schemacie. Baza jest swieza, wiec
# ten mechanizm jest niepotrzebny, a ryzykowny.
#
# Przy nieudanej migracji ponawiamy (baza moze jeszcze wstawac),
# a po wyczerpaniu prob zatrzymujemy wdrozenie z bledem w logu.

PROBA=1
until npx prisma migrate deploy; do
  if [ "$PROBA" -ge 10 ]; then
    echo "[start] Migracja nie powiodla sie po 10 probach. Przerywam."
    echo "[start] Zobacz blad powyzej — NIE oznaczam migracji jako wykonanej."
    exit 1
  fi
  echo "[start] Proba $PROBA z 10 nieudana. Czekam 5 s i ponawiam..."
  PROBA=$((PROBA+1))
  sleep 5
done

echo "[start] Schemat gotowy. Uruchamiam aplikacje."
exec "$@"
