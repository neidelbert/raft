# Horsts Zeugnis

| Stufe | Thema | Prüfung des Ausbilders | Horsts eigener Test | Ergebnis | Bemerkung |
|---|---|---|---|---|---|
| 1 | Grundgerüst und Hauptschleife | 9/9 | 25/25 | Stufe 1 bestanden | Sauber aufgeteilt (config, kern, welt), Ballregeln ohne DOM testbar. Eigenen Fehler (Zeitsprung nach Tab-Wechsel) selbst gefunden, Ursache behoben, Regel ins Lernbuch. Tempo auch bei gebremstem Gerät richtig. |
| 2 | Steuerung mit Touch | 12/12 | 52/52 | Stufe 2 bestanden | Schwebender Joystick, Mehrfinger sauber getrennt, Loslassen/Abbruch/Tab-Wechsel setzen zurück. Ein roter Punkt lag an der Prüfung des Ausbilders (Messung am Bildschirmrand), nicht an Horst – Prüfung korrigiert. Selbst gelernt: CDP-Mehrfinger-Verhalten per Versuch geklärt. |
| 3 | Viele Gegner | 10/10 | 59/59 | Stufe 3 bestanden | 240 Gegner mit 0,09 ms pro Schritt (Grenze 4 ms), Gitter und feste Zahlen-Listen, kein neuer Speicher pro Bild (mit Heap-Profiler gemessen). Stapeln im Gedränge selbst erkannt und an der Ursache gelöst. Offene Spielgefühl-Frage sauber an Lukas weitergegeben statt selbst entschieden. |
| 4 | Spielzustände und Speichern | 15/15 | 96/96 | Stufe 4 bestanden | Zustandsautomat sauber getrennt (ablauf/, oberflaeche/, kern/). Speicher übersteht 23 Arten kaputter Daten, privaten Modus und vollen Speicher. Zwei eigene Fehler vor der Abgabe gefunden (unnötiges Überschreiben, veraltete Anzeige). Schulden aus Stufe 3 abgebaut. Drei Spielgefühl-Fragen an Lukas statt eigener Entscheidung. |
| 5 | Fehlersuche und Code-Review | 10/10 | 22/22 | Stufe 5 bestanden | Alle 4 gemeldeten Fehler an der Ursache behoben, insgesamt 6 Ursachen gefunden (mehr als versteckt waren). Für jeden Fehler zuerst ein Test, der gegen den alten Code rot ist (12 rote Prüfungen gegen die Vorlage). Review und Bericht für Lukas verständlich. Ein roter Punkt lag an der Prüfung des Ausbilders (Simulation zu langsam, verwaister Testserver), nicht an Horst. |
| 6 | Spielgefühl, Sound, Ersatzbilder | 13/13 | 165/165 | Stufe 6 bestanden | Treffer-Blitz, Wackeln (nach 0,28 s ruhig), Partikel aus festem Vorrat, WebAudio erst nach Berührung, Ton-Einstellung mit Spielstand-Version 2 und Übernahme alter Stände. Grenze der Aufgabe selbst erkannt und belegt (Browser meldet fehlende Dateien immer, beide Wege getestet). Gegenprobe gegen eigenen Test gemacht. |

## Zeichner
| Testaufgabe | Ergebnis | Bemerkung |
|---|---|---|
| 5 Bilder „Sternenregen“ (Figur mit Korb, Stern, Stein, Herz, Nachthimmel) | bestanden | Einheitlicher Stil, alles fehlerfrei gerendert. Selbst nachgebessert: Mond gedämpft (Verwechslung mit Belohnung), Stein heller (Kontrast). Ablage: `ausbildung/zeichner-probe/sternenregen/`. |

## Tester
| Testaufgabe | Ergebnis | Bemerkung |
|---|---|---|
| Pilzsammler gründlich prüfen (ohne Hinweis auf die Fehler) | bestanden | Alle 4 versteckten Fehler gefunden, jeder mit Ursache (Zeile) und eigenem Nachweis. Dazu einen 5. echten Fehler (Pilze außerhalb des Bildes nach dem Drehen) und 3 kleinere Befunde. Ehrlich benannt, was nur am echten iPhone prüfbar ist. Bericht: `ausbildung/pruefungen/tester-bericht-pilzsammler.md` (bei den Prüfungen, damit er für Horsts Stufe 5 keine Lösung ist). |
