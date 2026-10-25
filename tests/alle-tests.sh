#!/usr/bin/env bash
# Alle Prüfungen nacheinander: bash tests/alle-tests.sh
# Team-Stimmigkeit, alle Spieltests (tests/*/*-test.js) und die Ausbildungsprüfungen bestandener Stufen.
cd "$(dirname "$0")/.." || exit 1
fehler=0
log=$(mktemp)
liste=(werkzeuge/pruefe-team.js tests/*/*-test.js)
for stufe in ausbildung/uebungen/stufe-*; do
  n=${stufe##*-}
  [ -f "ausbildung/pruefungen/stufe-$n.js" ] && grep -q "Stufe $n.*bestanden" ausbildung/ZEUGNIS.md 2>/dev/null && liste+=("ausbildung/pruefungen/stufe-$n.js")
done
for test in "${liste[@]}"; do
  [ -f "$test" ] || continue
  if node "$test" > "$log" 2>&1; then
    echo "OK     $test"
  else
    echo "FEHLER $test"
    grep -E "FEHLER|Error" "$log" | head -5 | sed 's/^/       /'
    fehler=$((fehler + 1))
  fi
done
rm -f "$log"
[ "$fehler" -eq 0 ] && echo "Alle Tests bestanden." || echo "$fehler Test(s) fehlgeschlagen."
exit "$fehler"
