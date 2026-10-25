# Bericht Übung 7 – 3D mit Three.js

## Ergebnis
Ein kleines rotes Segelboot schaukelt auf blauen, sich bewegenden Wellen. **Bereit zum Testen.**
- **Steuern:** Daumen irgendwo auf die linke Bildhälfte legen, dort erscheint der Joystick (aus Übung 2 übernommen). Nach oben schieben = Boot fährt vom Betrachter weg, nach rechts = nach rechts. Der Bug dreht sich weich in die Fahrtrichtung. Loslassen: Das Boot bleibt sofort stehen.
- **Kamera:** schaut schräg von oben (etwa 12 m entfernt) und zieht weich hinterher. Beim Fahren wird der Abstand kurz etwas größer (höchstens 9 %), beim Anhalten kommt sie wieder auf 12 m.
- **Bojen:** 30 rot-weiße Bojen mit gelber Spitze schwimmen verteilt auf den Wellen. Fährt das Boot an eine heran, springt sie 1,2 m hoch und fällt zurück. Bleibt das Boot an ihr, hüpft sie nicht dauernd, erst nach dem Wegfahren wieder.
- **Leistung:** Das ganze Bild braucht **4 Zeichenaufrufe** (erlaubt sind 20): Wasser, Boot, Schatten-Fläche, alle 30 Bojen zusammen. Die Bildschärfe (Pixel-Ratio, also wie viele echte Bildpunkte auf einen Punkt kommen) ist auf 2 begrenzt; das iPhone 13 hätte 3.

Ehrlich vorweg: Die dunkle Fläche unter dem Boot (statt eines echten Schattens) verschwindet auf Wellenbergen am Rand stellenweise im Wasser. Ob es am echten iPhone flüssig läuft, ist offen (siehe unten).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Gerüst: Seite mit Three.js 0.170.0 über die Import-Map, Bild füllt den Schirm, Pixel-Ratio ≤ 2, Hauptschleife mit gedeckelter Zeit. Prüfung: keine Konsolenfehler, Bildfläche = Bildschirm × 2.
2. Wellen als reine Rechnung (`welt/wellen.js`), die Wasser, Boot und Bojen gemeinsam nutzen. Prüfung ohne Browser: sichtbar, begrenzt, bewegt sich.
3. Wasserfläche (`welt/wasser.js`): wandert mit dem Boot mit und wirkt so endlos, Nebel verdeckt den Rand.
4. Boot: Fahrregeln (`welt/fahrt.js`, ohne Browser geprüft: oben = −z, schräg nicht schneller, ohne Eingabe Stillstand) und Modell aus fünf Grundformen, zu einem Stück verschmolzen (`welt/boot.js`).
5. Joystick aus Übung 2 kopiert, Anzeige mit zwei HTML-Kreisen statt 2D-Zeichnung (`steuerung/joystick-anzeige.js`).
6. Kamera folgt weich, unabhängig von der Bildrate (`welt/kamera-folge.js`).
7. Bojen: Regeln (`welt/bojen-regeln.js`: verteilen, Berührung, Hüpfen) und ein `InstancedMesh` mit einer Geometrie (`welt/bojen.js`).
8. Browser-Test, Gegenproben, Bildschirmfotos angesehen, eigenes Code-Review.

## Geänderte Dateien (alle neu in `ausbildung/uebungen/stufe-7/`)
- `index.html`, `stil.css`, `js/main.js`
- `js/config/`: `spiel.js`, `kamera.js`, `boot.js`, `wasser.js`, `bojen.js`, `modelle.js`, `steuerung.js`
- `js/kern/`: `renderer.js`, `formen.js`, `zufall.js` (aus Übung 6)
- `js/steuerung/`: `joystick.js` (aus Übung 2, nur das 2D-Zeichnen entfernt), `joystick-anzeige.js`
- `js/welt/`: `wellen.js`, `wasser.js`, `fahrt.js`, `boot.js`, `bojen-regeln.js`, `bojen.js`, `kamera-folge.js`
- `test.js` (Port 8870), `SCHULDEN.md`, dieser Bericht; außerhalb nur mein Lernbuch-Eintrag

## Testergebnis
`node ausbildung/uebungen/stufe-7/test.js`: **46 von 46 Prüfungen bestanden**, in fünf Läufen. `bash tests/alle-tests.sh`: „Alle Tests bestanden.“
- Keine Konsolenfehler (mit und ohne `?test=1`); ohne `?test=1` gibt es kein `spiel.test`.
- Joystick oben → Boot fährt nach −z (x bleibt 0), Kamera fährt mit. Loslassen und Abbruch durch das System (`touchCancel`) stoppen sofort, der Joystick verschwindet.
- Kamera-Abstand in jedem Bild gemessen: 12,04 … 13,15 m (Soll 12,04 m ± 15 %), nach dem Halt wieder 12,04 m.
- Zeichenaufrufe in jedem Bild gemessen: höchstens **4** (Grenze 20). Dreiecke: 5.572.
- Pixel-Ratio 2 bei einem Gerät mit 3, Bildfläche 780 × 1328 = 390 × 664 × 2.
- 30 Bojen als ein `InstancedMesh`; Boot auf eine Boje gesetzt → genau sie hüpft (0,03 → 1,39 m) und schwimmt danach wieder.
- Joystick rechts → +x; Tippen und Ziehen in der rechten Hälfte bewegt nichts.
- **Gegenproben** (Kopie mit absichtlichen Fehlern): z-Richtung vertauscht, Pixel-Ratio 3, Bojen hüpfen nie → 13 Prüfungen rot; Kamera folgt nicht und 40 zusätzliche Zeichenaufrufe → 5 rot. Der Test taugt also.
- Bildschirmfotos angesehen (Start, Fahrt mit Joystick, hüpfende Boje): sieht aus wie gewollt.
- Nicht automatisch prüfbar: echte Bildrate am iPhone, Gefühl beim Steuern, Grafik-Absturz.

## Was beim Bauen auffiel
1. Der erste Kamerawinkel (13 m hoch, 11 m zurück) zeigte das Boot zu klein und fast keine Bojen. Kamera näher (8 m / 9 m), Bojen dichter (Feld ±22 m statt ±30 m), Sonne von der Seite, damit Wellenkanten und Bojen hell sind.
2. Der weiße Ring der Bojen lag zuerst im roten Körper versteckt (Radius zu klein). Behoben.
3. Mein erster Fahrtest verlangte „mindestens 6 m in 1,5 s“. Unter Last (Gegenprobe mit mehr Zeichenaufrufen) fährt das Boot im Test-Browser langsamer, weil die Bildzeit gedeckelt wird. Für die Richtung reicht „mehr als 1 m nach −z“; das Tempo prüft die Regel ohne Browser.
4. Versuch, die Bojen-Matrizen von Hand zu schreiben statt mit einem Hilfsobjekt: in Chrome anfangs sogar mehr Speicher pro Bild. Wieder zurückgebaut, die einfache Lösung bleibt.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `BOOT.tempo` | 6 m/s | `js/config/boot.js` | Fahrtempo bei vollem Ausschlag |
| `BOOT.drehTempo` | 7 | `js/config/boot.js` | wie schnell sich der Bug dreht |
| `BOOT.schaukeln` | 0,06 | `js/config/boot.js` | wie stark das Boot zur Seite kippt |
| `KAMERA.versatzY` / `versatzZ` | 8 m / 9 m | `js/config/kamera.js` | Höhe und Abstand hinter dem Boot |
| `KAMERA.folgeTempo` | 4 | `js/config/kamera.js` | wie straff die Kamera folgt |
| `WELLEN` | 0,3 / 0,16 / 0,06 m hoch | `js/config/wasser.js` | Höhe der drei Wellen |
| `BOJEN.huepfHoehe` / `huepfDauer` | 1,2 m / 0,6 s | `js/config/bojen.js` | Hüpfer der Boje |
| `BOJEN.bereich` / `abstandMin` | ±22 m / 3,5 m | `js/config/bojen.js` | wie weit und wie dicht die Bojen liegen |
| `LICHT.himmelStaerke` / `sonnenStaerke` | 1,6 / 1,8 | `js/config/spiel.js` | Helligkeit |
| `SPIEL.kantenglaettung` | an | `js/config/spiel.js` | bei Ruckeln zuerst ausschalten |

## Was der Tester am echten iPhone prüfen soll
- Läuft es flüssig (Safari ab 16.4 wegen der Import-Map)? Ruckelt es, zuerst `SPIEL.kantenglaettung` aus.
- Fühlt sich das sofortige Anhalten beim Loslassen gut an, oder soll das Boot kurz nachgleiten? (Frage an Lukas)
- Zoomt oder scrollt die Seite beim Steuern? Funktioniert der Joystick nach einer Systemgeste (Wischen vom Rand) wieder?
- Stört der Rand der dunklen Fläche unter dem Boot?

## Fragen an Lukas
- Soll das Boot nach dem Loslassen kurz nachgleiten (wie ein echtes Boot)? Der Auftrag sagt „Loslassen stoppt“, darum steht es jetzt sofort.
- Sollen Bojen weggeschoben werden und soll die Welt endlos Bojen haben? (in `SCHULDEN.md`)
