#!/usr/bin/env bash
# Alle Prüfungen nacheinander: bash tests/alle-tests.sh
# Bricht nicht beim ersten Fehler ab, meldet am Ende die Summe.
cd "$(dirname "$0")/.." || exit 1
fehler=0
for test in werkzeuge/pruefe-team.js tests/buero-test.js tests/spiel/*-test.js tests/agenten/prototyp-test.js tests/agenten/joystick-pruefung.js; do
  [ -f "$test" ] || continue
  if node "$test" > /tmp/raft-test.log 2>&1; then
    echo "OK     $test"
  else
    echo "FEHLER $test"
    grep -E "FEHLER|Error" /tmp/raft-test.log | head -5 | sed 's/^/       /'
    fehler=$((fehler + 1))
  fi
done
[ "$fehler" -eq 0 ] && echo "Alle Tests bestanden." || echo "$fehler Test(s) fehlgeschlagen."
exit "$fehler"
