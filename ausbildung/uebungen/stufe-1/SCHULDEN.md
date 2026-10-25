# Technische Schulden – Übung 1

| Was | Warum | Aufwand |
|---|---|---|
| Der Tab-Wechsel wird im Test nur nachgestellt (`document.hidden` überschrieben, Seite 1 s blockiert). | Der Test-Browser kann keinen echten Tab-Wechsel auslösen. | Echt nur am iPhone prüfbar, kein Code-Aufwand. |
| Keine `bash tests/alle-tests.sh` im Projekt. | Gibt es in diesem Ordner noch nicht; der Test läuft einzeln. | Klein, sobald es die Sammeldatei gibt. |
