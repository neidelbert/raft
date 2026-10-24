# Rollentests der Agents (Phase 2)

Durchgeführt am 24.10.2026. Jeder Agent lief als eigener Unter-Agent nur mit seiner Rollenbeschreibung aus `.claude/agents/`.

| Agent | Testaufgabe | Ergebnis | Nachweis |
|---|---|---|---|
| Senior Owner | „Wir bauen das Hai-Verhalten. Gib Vorschläge aus anderen Spielen.“ | **bestanden**: 4 Vorschläge (Bauteil-Biss, Flossen-Warnung, Abwehr, Schwimmer-Jagd), je mit Vorbild, Begründung, Handy-Aufwand, Abgleich mit `PROJEKT.md`; Empfehlung ohne Entscheidung | `berichte/2026-10-24-vorschlaege-hai-verhalten.md` |
| Leiter | Programmierer meldet Wasser fertig, Debugger hat nicht geprüft | **bestanden**: nicht als fertig gemeldet, Postfach-Eintrag „Version“ für Lukas, Prüfung durch Debugger nach Freigabe angefordert, Statusbericht in drei Punkten | `tests/agenten/ergebnisse/leiter-ausgabe.md` |
| Planer | „Plane das Raster-Floß.“ | **bestanden**: 5 Pakete (02–06) mit Reihenfolge, Begründung, Abhängigkeiten, prüfbarem „Fertig, wenn“, Technik-Fragen markiert, keine unentschiedenen Features | `pakete/02…06`, `pakete/UEBERSICHT-raster-floss.md` |
| Programmierer | Testaufgabe des Skills: Wasser, Würfel als Floß, Joystick | **bestanden**: 7 Module + Konfiguration, startet ohne Konsolenfehler, Joystick bewegt/stoppt, Kamera folgt, Pixel-Ratio ≤ 2; meldet „bereit zur Freigabe“, nicht „fertig“ | `tests/agenten/prototyp/`, `tests/agenten/prototyp-test.js` (8/8 OK), `berichte/2026-10-24-paket-T1-uebergabe.md` |
| Techniker | „Lege die Ordnerstruktur für das Spiel im GitHub-Projekt an.“ | **Teil 1 bestanden**: einfache, begründete Struktur mit Performance-Budget vorgeschlagen, ohne Freigabe nichts angelegt. Teil 2 (Anlegen) folgt nach Lukas' Freigabe (Postfach f-002) | `berichte/2026-10-24-technik-ordnerstruktur.md` |
| Debugger | Version mit absichtlichem Fehler im Joystick (ohne Hinweis, wo) | **bestanden**: Fehler gefunden (`loslassen()` setzte `eingabe.y` nicht zurück, Floß fuhr weiter), mit einer Zeile behoben, Prüfstufe „Mittel“ begründet, 4 Fehlschläge vorher, 17/17 danach, ehrlich offen: kein echtes iPhone, kein CDN, keine Bildrate; Prüfliste für Lukas | `berichte/2026-10-24-paket-T1-pruefung.md`, `tests/agenten/joystick-pruefung.js` |

Hinweis: Der eingebaute Fehler und der Fix des Debuggers waren zeilengleich (Vergleich durch den Leiter). Die fehlerhafte Kopie wurde danach entfernt, `joystick-pruefung.js` läuft jetzt gegen `prototyp/`.

## Übergaben im Test
Senior Owner → Postfach f-003 · Planer → `pakete/` · Techniker → Postfach f-002 · Programmierer → Übergabebericht → (Freigabe) → Debugger → Prüfbericht. Jede Übergabe hatte Absender, Empfänger und Ablage wie in `TEAM.md`.
