# Prüfbericht Paket T1 (Testpaket) – Debugger an Leiter
Datum: 24.10.2026 · Geprüft: `tests/agenten/prototyp/` (von Lukas freigegeben, laut Auftrag mit absichtlichem Joystick-Fehler)
Ergebnis: **Fehler gefunden und behoben, alle 17 automatischen Prüfungen bestanden.** Offen ist nur der Test auf dem echten iPhone.

## 1. Geprüft
**Prüfstufe: Mittel.** Begründung: Der Fehler betrifft die Bedienung (Touch-Joystick). Es geht nicht um Performance oder Akku, also ist Stufe „Hoch“ für die Reparatur nicht nötig. Die Safari-Punkte aus dem Übergabebericht kann ich trotzdem nur über Lukas prüfen (siehe 4).

Wie:
- Code aller 7 Dateien gelesen (`index.html`, `js/*.js`). Den Ordner `prototyp/` habe ich laut Testregel weder geöffnet noch zum Vergleich genutzt.
- Neues Prüfskript `tests/agenten/joystick-pruefung.js`: Kopie von `prototyp-test.js`, zeigt auf `debugger-test/`, nutzt Port 8766 und hat Zusatzprüfungen. Läuft mit Playwright/Chromium, iPhone-13-Emulation, echten Touch-Ereignissen über CDP, SwiftShader und der lokalen three.js-Datei (das CDN ist hier gesperrt).
- Lauf **vor** der Reparatur: 4 Prüfungen fehlgeschlagen. Lauf **nach** der Reparatur: zweimal hintereinander alle 17 bestanden.

Fertig-Bedingungen des Pakets einzeln:
- [x] Startet ohne Konsolenfehler
- [x] Joystick nach oben: Floß fährt weg (z 0 → −6,7), ohne Seitendrift
- [x] Loslassen stoppt (erst nach der Reparatur)
- [x] Kamera folgt (Kamera-z 10 → 4)
- [x] Kleine Module, Werte in `js/konfiguration.js`, Pixel-Ratio 2, Bewegung mit Delta-Zeit (Code gelesen, Pixel-Ratio gemessen)

Altes und Zusätze kurz durchgespielt: rechts ziehen fährt nach rechts; diagonal ergibt x/y je 0,71; der Knopf springt zur Mitte zurück; die Totzone greift; ein zweiter Finger wird ignoriert; mit der Maus nach unten ziehen fährt das Floß zum Betrachter, Loslassen stoppt; die Seite scrollt und zoomt nicht; das Bild hat Inhalt.

## 2. Gefunden
**Joystick: Nach dem Loslassen fährt das Floß weiter nach oben oder unten.** In `loslassen()` wurde nur `eingabe.x` auf 0 gesetzt, `eingabe.y` blieb auf dem letzten Wert. Der Knopf sprang zwar sichtbar zur Mitte zurück, das Floß fuhr aber weiter. Gemessen vor der Reparatur: nach dem Loslassen `y = 0,707`, das Floß bewegte sich weiter. Das gilt für Touch, Maus und `pointercancel` (alle laufen über dieselbe Funktion).

## 3. Behoben
- Datei `tests/agenten/prototyp/js/steuerung.js`, Zeile 39 neu: `eingabe.y = 0;` (direkt nach `eingabe.x = 0;` in `loslassen()`).
- Das ist eine einzige Zeile, sonst ist nichts geändert. Das Spielgefühl ändert sich dadurch nicht, die Reparatur stellt nur das Verhalten aus dem Paket her.
- Im Prüfskript selbst musste ich eine Stelle korrigieren: Die Zweitfinger-Prüfung schickte ein ungültiges CDP-`touchEnd` mit Punkten. Jetzt hebt Finger 2 über ein `touchMove` nur mit Finger 1 ab. Vor dem Fix fiel der Testfehler nicht auf, weil der Spielfehler ihn verdeckte.

## 4. Offen / nicht geprüft
- **Nicht auf dem echten iPhone (Safari) geprüft.** Ich habe nur in Chromium mit iPhone-Emulation getestet und three.js lokal statt vom CDN geladen. Das Laden vom CDN ist also nicht geprüft.
- Nicht geprüft: Bildrate und Akku (die CPU-Wellen aus dem Übergabebericht), Safari-Eigenheiten wie Wischgesten am Rand, Safe-Area und das Verhalten im Querformat.
- Prüfliste für Lukas (iPhone, Safari, höchstens 5 Schritte):
  1. Seite öffnen: Wasser und Würfel sind zu sehen.
  2. Joystick nach oben ziehen: Das Floß fährt vom Bildschirm weg.
  3. Loslassen: Das Floß bleibt sofort stehen.
  4. Schräg ziehen und loslassen: Das Floß bleibt stehen, nichts scrollt oder zoomt.
  5. Eine Minute fahren: Läuft es flüssig? (ja/nein an den Leiter)
- Kein Git-Commit (Vorgabe des Rollentests).
