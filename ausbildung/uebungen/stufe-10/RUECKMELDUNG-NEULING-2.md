# Rückmeldung zur Probe „ausweichprobe“ (Skills game-programmierung + zeichnen)

Gearbeitet nur mit `skills/` und `arbeit/`. Spiel: `arbeit/ausweichprobe/`, Hilfsskripte: `arbeit/hilfen/`, Gegenproben: `arbeit/kaputt/`.
Bericht fürs Spiel: `arbeit/ausweichprobe/BERICHT-2026-10-26-ausweichprobe.md`, Schulden: `arbeit/ausweichprobe/SCHULDEN.md`.

## 1. Was klappte
- **Gerüst:** `neues-spiel.js` lief sofort, Test auf Anhieb grün (52 Prüfungen, 39 s). `LIESMICH.md` erklärt jede Datei, der Werkzeug-Pfad darin (`../../skills/...`) stimmte.
- **Zeichnen → Atlas:** `data-anker` → `render.js` → `grafik.json` → `atlas.js` lief ohne eine einzige Handrechnung. Der Platzhalter wurde automatisch gelöscht. Der Kontaktbogen mit rotem Fußpunkt-Kreuz hat sofort einen Fehler gezeigt (Mützen-Bommel in den Hochpunkt-Rahmen oben abgeschnitten).
- **Animationen aus Dateinamen** (`held-lauf-1…4`, `explosion-1…4`) entstehen in `atlas.js` von selbst, Tempo/Schleife in `atlas.json`. `animation.js` (`spieleAb`, einmalige Animation meldet genau einmal „fertig“, Spiegeln über `blick`) und `holeAnimation` (Einzelbild als Animation) passten genau auf den Auftrag.
- **Sound:** Das Explosions-Rezept aus `wissen/assets.md` ließ sich 1:1 als „treffer“ in `sounds.json` übernehmen; Code-Klang gleichen Namens als Ersatz funktioniert ohne Zusatzcode.
- **Test-Vorbild:** Der Gerüst-Test (`ZAEHLE_PUFFER`, `routen`, `laufeZu`, Tab-Trick) war die beste Anleitung. „Dinge per `spiel.test` an feste Orte legen“ (testen.md) machte die Treffer-Prüfung einfach und sicher.
- Lernbuch-Regeln halfen konkret: Rückmeldung über eine gemeinsame Funktion (`beiTreffer`), Effekte in jedem Zustand rechnen (Explosion läuft nach dem letzten Treffer auf der Ende-Tafel weiter), Rahmenschritte statt Wechsel zählen, Spiegeln über umhülltes `scale` prüfen, Ausgaben in Dateien statt `| head`.

## 2. Wo ich raten musste
- **Größen von Gegner und Explosion im Spiel:** nicht vorgegeben. Ich habe 88 Punkte (Schleim, 176 px) und 96 Punkte (Explosion, 192 px) gewählt. Das Handbuch sagt „Frage an Lukas“; in einer Probe ohne Lukas habe ich selbst entschieden.
- **4 statt 6 Lauf-Rahmen, 4 statt 5–8 Explosions-Rahmen:** Der Zeichnen-Skill beschreibt nur den 6-Rahmen-Laufzyklus. Für 4 Rahmen habe ich Kontakt → Durchgang (hoch) → Kontakt (anderes Bein) → Durchgang gewählt.
- **Fußpunkt der Explosion:** Checkliste sagt „Gegenstände mittig“, Effekte stehen nicht drin. Ich habe ihn unten gesetzt, damit die Explosion am Fußpunkt des Gegners sitzt.
- **`groessen.json`-Schlüssel:** Nur ein Beispiel (`boden/nacht`). Ob Rahmen einzeln oder als Gruppe eingetragen werden, stand nirgends; ich habe jeden Rahmen einzeln eingetragen. Erst im Code von `render.js` gesehen, dass auch der Gruppenname geht.
- **Wo die Figur-Animation entschieden wird:** Regel (`laeuft`, `blick` in `regeln/spieler.js`) vs. Darstellung (`darstellung.aktualisiere`). Kein Muster im Gerüst, nur das Beispiel im Kopf von `animation.js`.
- **Ersatz für neue Rahmen:** Das Gerüst-`baueErsatz()` kennt nur die Figur. Dass Gegner und Explosion bei fehlendem Atlas ebenfalls Ersatz brauchen (sonst unsichtbar), musste ich aus dem Kopfkommentar von `assets.js` (`ersatz()` liefert auch `animationen`) ableiten. `holeAnimation` braucht ein `assets`-Objekt; für „Atlas + Ersatz zusammen“ habe ich ein Hilfsobjekt gebaut.
- **Spielregeln außerhalb des Auftrags:** Runde endet bei 0 Leben (sonst Leben ohne Folge), keine neuen Schleime, Punkte bleiben die Platzhalter-Regel. Als Fragen in Bericht und `SCHULDEN.md`.

## 3. Unklare, falsche oder fehlende Stellen im Skill
1. **Gerüst-Fehler: Ton-Knopf überdeckt den Kopf der Figur** oben rechts (im Bildschirmfoto sichtbar). `setzeFeld` misst nur die Leiste, nicht den Knopf. Das ist dieselbe Klasse Fehler wie Lernbuch Stufe 10 („Grenzen nur für den Platzhalter“): Mit der echten 128-Punkte-Figur fällt es auf.
2. **Leiste wird eng:** Mit einem dritten Wert (Leben) steht der Text bei 390 Punkten Breite direkt am Ton-Knopf. Kein Hinweis, wie die Leiste wachsen soll.
3. **Bilder mit dt = 0:** Die Schleife liefert absichtlich `dt = max(0, …)` (Lernbuch Stufe 1). Das Gerüst-`bewegeSpieler` behandelt dt = 0 nicht; jede Regel „hat sich in diesem Bild bewegt“ (Lauf ↔ Stand) kippt dann ein Bild lang und startet die Lauf-Animation von vorn. Per Regel-Test nachgewiesen und behoben (`if (dt <= 0) return`); dass es im Browser genau das war, konnte ich nicht einzeln belegen. Sollte in `aufbau.md`/Gerüst stehen.
4. **Tests unter Last (fehlt in testen.md):** Mit mehreren Testläufen parallel (Gegenproben) wurde auch der richtige Code rot. Zwei Test-Schwächen: (a) `t.ziehe` dauert unter Last so lange, dass die Figur schon an der Wand steht, bevor die Beobachtung beginnt (dort ist „Stehen“ richtig). Regel: nur Bilder werten, in denen sich die Figur bewegt hat. (b) `seite.screenshot` dauert unter Last Sekunden bis über 30 s, das Spiel läuft weiter (Gegner kriechen heran, zusätzlicher Treffer). Regel: Foto bei Pause (Tab-Trick). Dazu fehlt ein Hinweis, wie viele Testläufe parallel gehen (4 Chromium → Zeitüberschreitungen beim Foto).
5. **Zeichnen-Skill:** Kein Hinweis, dass die viewBox für **alle** Rahmen nach dem größten Ausschlag gewählt werden muss (Körper-Hub nach oben schnitt den Bommel ab; die Vorlage hat oben nur 4 Einheiten Luft). Laufzyklus nur für 6 Rahmen beschrieben. Effekte fehlen in der Fußpunkt-Regel. `groessen.json` mit Gruppenschlüssel nicht dokumentiert.
6. **Ersatz-Test deckt neue Rahmen nicht ab:** Der Gerüst-Test prüft bei fehlendem Atlas nur die Ersatz-Figur. Kein Hinweis im Handbuch, die Ersatzfälle bei neuen Rahmen (Gegner, Effekte) zu erweitern. Ich habe es nicht mehr gemacht (in `SCHULDEN.md`).
7. **Feldgrenzen aus dem Stand-Bild:** Lauf-Rahmen sind anders zugeschnitten (Arme/Beine weiter außen). Die Grenze gilt nur für `SPIELER.rahmen`; wie man das bei Animationen handhabt, steht nirgends (klein, aber Stufe-10-Thema).
8. Kleinigkeit: SKILL.md nennt „Startpaket 6793 Bytes“-Meldungen und Ports gut; aber die Laufzeit eines Gerüst-Tests (~40–50 s) steht nirgends. Ein Agent mit 120-s-Befehlsgrenze sollte wissen, dass Gegenproben in den Hintergrund gehören.

## 4. Testergebnis
- `node arbeit/ausweichprobe/tests/ausweichprobe-test.js` allein: **81 Prüfungen, alle bestanden** (46 s). Neu davon 29: Gegner-Regeln mit festen Orten (Verteilen mit Abstand und Seed, Kriechen ohne Überschießen, Treffer am Rand/knapp außerhalb, Leben nie unter 0, dt 0), im Browser: 3 Schleime/3 Leben beim Start, Stand-Bild ohne Daumen, Lauf-Animation beim Bewegen mit Rahmenwechsel, Blick und Spiegeln, zurück zum Stand-Bild, Schleim kriecht höchstens mit `GEGNER.tempo`, Treffer → Schleim weg + Explosion + Sound-**Datei** + Leben −1 + Leiste, kein Doppeltreffer, Explosion endet nach 0,38 s (Animation 0,40 s), neue Runde, Leben 0 → Ende.
- **Gegenprobe** (je eine kaputte Kopie, `ORDNER=…`): Lauf-Animation nie gestartet → 2 rot; Leben zählt nicht → 3 rot; Explosion endet nie → rot (Abbruch nach Zeitgrenze). Jeweils nur die gemeinten Prüfungen.
- **Unter Last:** Mit 4 parallelen Läufen brechen alle beim Bildschirmfoto ab (30-s-Zeitgrenze von Playwright). Mit 2 parallel ist mein Teil grün, aber der Gerüst-Teil „Neuladen → Titel in 15 s“ lief einmal in die Zeitgrenze. Zuverlässig ist nur ein Lauf allein.
- Bildschirmfotos angesehen: `arbeit/ausweichprobe/tests/fotos/ausweichprobe.png` (Figur, Explosion am Bauch, zwei Schleime, Leiste) und `…-ersatz.png` (Ersatz-Figur, wenn der Atlas fehlt). Kontaktbogen `arbeit/ausweichprobe/grafik/kontaktbogen.png`.
- Nicht geprüft: Ersatz-Schleim/-Explosion im Spiel, Klang und Gefühl am iPhone, Speicher-Messung (Heap-Profiler) für die neuen Teile.

## 5. Zeitbedarf und Hänger
Laut Uhr etwa 30 Minuten Arbeit (07:54–08:19 UTC, also eher 25 Minuten), davon gut ein Drittel Warten auf Testläufe (je 40–50 s, Gegenproben ein paar Minuten).
- Lesen und Gerüst: ca. 5 Min., ging glatt.
- Zeichnen: ca. 5 Min.; ein Nachbessern (Bommel abgeschnitten).
- Code: ca. 8 Min., erster Testlauf hatte nur einen Fehler im eigenen Test (Schleim landete am Feldrand direkt bei der Figur).
- **Hängen geblieben** bin ich bei den Gegenproben: Parallel gestartet wurde auch der richtige Code rot. Drei Anläufe, bis klar war, dass es Test-Schwächen unter Last waren (Wand, langsames Foto) und zusätzlich eine echte Schwäche (dt 0). Außerdem stoppt meine Umgebung Befehle nach 120 s; der erste Gegenproben-Lauf wanderte unbemerkt in den Hintergrund.
- Kleiner Stolperstein: `pgrep -fa http.server` (Lernbuch-Tipp) findet sich selbst bzw. die eigene Befehlszeile und meldet fälschlich „Server übrig“.
