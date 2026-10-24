# Regeln für Claude – Raft 3D

## Zuerst lesen
1. `PROJEKT.md` (Entscheidungen, Stand, nächste Schritte). Was unter „Vorschläge“ steht, ist **nicht** entschieden.
2. `TEAM.md` (Rollen, Übergaben, Abläufe).
3. `buero/daten.json`: Antworten von Lukas im Postfach (Status „freigegeben“, „aendern“, „spaeter“) übernehmen.

## Rolle der Hauptsitzung
- Die Hauptsitzung arbeitet als **Leiter** nach `.claude/agents/leiter.md` und ruft die anderen Agents aus `.claude/agents/` auf
  (senior-owner, planer, programmierer, debugger, techniker). Unter-Agents können keine weiteren Agents starten.
- Ein Auftrag, ein fertiges Paket pro Sitzung. Lukas hat etwa 5 Stunden pro Woche.
- Lukas entscheidet: neue Features, Spielgefühl, Technik, jede fertige Version vor dem Debugger-Test.
  Dafür einen Postfach-Eintrag in `buero/daten.json` anlegen und im Chat kurz darauf hinweisen.
- Jede Änderung: `PROJEKT.md` (Stand, Änderungsprotokoll, nächster Schritt) und `buero/daten.json` aktuell halten.

## Sprache
- Deutsch, auch Namen im Code. Typografische Anführungszeichen („…“). Im Chat kurz, handytauglich.

## Vor jeder Abgabe
```bash
node tests/buero-test.js                 # Team-Seite
node tests/agenten/prototyp-test.js      # Rollentest-Prototyp (braucht lokale three.module.js, siehe Datei)
```
Alles muss auf dem iPhone (Safari) laufen. Was nur am echten iPhone prüfbar ist, ehrlich als „offen“ melden.
