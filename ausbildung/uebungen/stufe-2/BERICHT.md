# Bericht Übung 2 – Steuerung mit Touch

## Ergebnis
Die Figur steht in der Mitte. Wo der linke Daumen aufsetzt, erscheint ein Joystick (Ring mit Knopf); Ziehen bewegt die Figur mit 220 Punkten pro Sekunde, schräg genauso schnell wie gerade. Loslassen stoppt sofort. Rechts unten ist ein runder Knopf „Sprung“ (80 × 80 Punkte): Die Figur hüpft 0,4 s (nur optisch, ihr Schatten wird dabei kleiner). Springen geht auch mit einem zweiten Finger, während der erste läuft, ohne die Laufrichtung zu stören. Die rechte Bildschirmhälfte bewegt nichts. Die Figur bleibt immer ganz im Bild. Die Seite scrollt und zoomt nicht. Bereit zum Testen.

Ein Fehler lag beim Bauen in meinem eigenen Test, nicht im Spiel (siehe „Was beim Bauen auffiel“).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Gerüst aus Stufe 1 übernehmen (scharfer Bildschirm, Hauptschleife mit Delta-Zeit, also der Zeit seit dem letzten Bild) – Prüfung: Start ohne Fehler.
2. Bild `figur.png` über `grafik/grafik.json` laden, Ersatzkreis, falls es fehlt – Prüfung: Bild geladen; mit kaputtem Bild läuft das Spiel.
3. Figur-Regeln ohne Browser: bewegen, schräg kürzen, im Bild halten, Sprung 0,4 s – Prüfung: Rechentests mit `node`.
4. Schwebender Joystick nur in der linken Hälfte, nur der erste Finger zählt, Loslassen und Abbruch setzen alles zurück – Prüfung: Ziehen rechts/oben/schräg, Loslassen, Abbruch.
5. Sprung-Knopf, der sofort beim Aufsetzen auslöst und eigene Finger hat – Prüfung: zweiter Finger während des Ziehens.
6. Seite gegen Scrollen und Zoomen sperren – Prüfung: nach allen Gesten kein Scrollen, Zoom 1.

## Geänderte Dateien (alle neu, in `ausbildung/uebungen/stufe-2/`; Stufe 1 unverändert)
- `index.html`, `stil.css` – Seite, Joystick-Feld (linke Hälfte), Sprung-Knopf
- `js/main.js` – Start, Hauptschleife, Tab-Pause, `window.spiel`
- `js/config/spiel.js`, `js/config/spieler.js`, `js/config/steuerung.js` – alle Einstellwerte
- `js/kern/bildschirm.js` (aus Stufe 1), `js/kern/bilder.js` – Bildschirm, Bilder laden
- `js/steuerung/joystick.js`, `js/steuerung/knopf.js` – Joystick und Knopf
- `js/welt/spieler.js` – Figur bewegen, springen, zeichnen
- `grafik/` – Kopie aus `ausbildung/grafik/`
- `test.js` (Port 8820), `SCHULDEN.md`, dieser Bericht

## Testergebnis
`node ausbildung/uebungen/stufe-2/test.js`: **52 von 52 Prüfungen bestanden**, mehrmals hintereinander. Der Test von Stufe 1 ist weiter grün.
Geprüft u. a.: Ziehen nach rechts → Figur nach rechts (223 Punkte/s), nach oben → nach oben; Loslassen und Abbruch durch das System → Eingabe 0 und Figur steht; schräg 221 statt 223 Punkte/s (nicht schneller); zweiter Finger auf „Sprung“ während des Ziehens springt, Richtung bleibt (1,00|0,00), Figur läuft weiter; Abheben eines Fingers stört den anderen nicht; zweiter Finger links übernimmt den Joystick nicht; Tippen und Ziehen rechts bewegt nichts; Sprung dauert etwa 400 ms, langes Drücken springt nicht doppelt; Figur bleibt bei langem Laufen in alle Richtungen im Bild; gleiches Tempo bei gebremster Bildrate (≈ 20 Bilder/s); Tab-Wechsel mit liegendem Finger setzt die Eingabe zurück; Maus geht am PC auch; kein Scrollen, kein Zoom, `touch-action: none` überall; kaputtes Bild → Ersatzkreis, keine Konsolenfehler; ohne `?test=1` kein `spiel.test`.
Bildschirmfotos angesehen: Figur scharf mit Schatten, Joystick halbdurchsichtig unter dem Daumen, Knopf rund rechts unten; Ersatzkreis sichtbar, wenn das Bild fehlt.

`bash tests/alle-tests.sh` meldet einen Fehler, der nicht von mir kommt: `werkzeuge/pruefe-team.js` vermisst `ausbildung/uebungen/stufe-8/BERICHT.md` (gibt es noch nicht). Bitte an den Spiel-Leiter.

## Was beim Bauen auffiel
Beim Test „Sprung-Finger hebt ab, Joystick läuft weiter“ war mein Test falsch: Bei der Test-Steuerung von Chromium nennt man beim Abheben die Finger, die *abheben*, nicht die, die liegen bleiben. Ich hatte so den Joystick-Finger hochgehoben. Mit einem kleinen Versuch nachgewiesen, Test korrigiert, das Spiel war richtig.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `laufTempo` | 220 | `js/config/spieler.js` | Punkte pro Sekunde (aus dem Auftrag) |
| `hoehe` | 72 | `js/config/spieler.js` | Größe der Figur in Punkten |
| `sprungDauer` | 0,4 | `js/config/spieler.js` | Sekunden (aus dem Auftrag) |
| `sprungHoehe` | 28 | `js/config/spieler.js` | wie hoch die Figur hüpft |
| `radius` | 50 | `js/config/steuerung.js` | so weit ziehen für volles Tempo |
| `totzone` | 0,12 | `js/config/steuerung.js` | kleines Zittern bewegt nichts |
| Knopfgröße | 80 × 80 | `stil.css` | Sprung-Knopf (Auftrag: mindestens 64) |

## Was der Tester am echten iPhone prüfen soll
- Mit dem linken Daumen laufen und gleichzeitig mit dem rechten springen: Bleibt die Richtung, kommt jeder Sprung?
- Mit zwei Fingern auf den Bildschirm zoomen und doppelt tippen: Darf nichts zoomen oder scrollen.
- Während des Laufens vom unteren Rand nach oben wischen (App-Wechsel) und zurück: Die Figur darf nicht weiterlaufen.
- Fühlt sich der Joystick-Radius (50 Punkte) gut an? Ist der Sprung-Knopf gut erreichbar, auch mit Hülle?
