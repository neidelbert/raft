# Code-Review Pilzsammler (Vorlage `ausbildung/vorlagen/pilzsammler/js/main.js`)

Fünf Punkte, die wichtigsten zuerst (Fehler → Leistung → Wartbarkeit → Stil). Zeilen beziehen sich auf die Vorlage.

1. **Fehler – Bewegung pro Bild statt pro Sekunde (Z. 45–46, 70).** `spieler.x += eingabe.x * 4` läuft einmal pro Bild. Bei 30 Bildern/s läuft die Figur halb so schnell, auf 120-Hz-iPhones doppelt so schnell.
   *Vorschlag:* Delta-Zeit aus dem `requestAnimationFrame`-Zeitstempel, gedeckelt auf 0,1 s, Tempo in Punkten pro Sekunde in `config` (240 = bisher 4 × 60). Umgesetzt.
2. **Fehler – Joystick hört nur auf `pointerup` (Z. 32–34).** Kein `pointercancel` (kommt auf dem iPhone, wenn das System die Berührung übernimmt), kein Pointer-Capture (Maus außerhalb losgelassen), keine Finger-Nummer (ein zweiter Finger übernimmt den Joystick oder beendet ihn).
   *Vorschlag:* `setPointerCapture`, nur den ersten Finger beachten, `pointerup`, `pointercancel` und `lostpointercapture` setzen alle Eingabewerte zurück. Umgesetzt.
3. **Fehler – Speicher ohne Absicherung (Z. 23, 55).** `localStorage` und `JSON.parse` stehen ohne `try/catch` ganz oben im Modul: Ist der Speicher gesperrt oder der Wert kaputt, bricht das Modul ab und nichts startet. `setItem` in `schritt` wirft im alten privaten Modus von Safari; weil `requestAnimationFrame` erst am Ende von `bild` steht, bleibt das Spiel dann stehen.
   *Vorschlag:* Lesen/Schreiben in `js/speicher.js` mit `try/catch`, Wert prüfen (ganze Zahl ≥ 0), sonst 0. Umgesetzt.
4. **Fehler – Punkte zählen falsch (Z. 51–53, 26).** `filter` entfernt alle Pilze in Reichweite, `punkte++` zählt aber nur einen. Neue Pilze entstehen auch direkt unter der Figur und sind im nächsten Bild weg.
   *Vorschlag:* Jeder entfernte Pilz gibt einen Punkt; neue Pilze mindestens 80 Punkte von der Figur entfernt (Wert in `config`). Umgesetzt.
5. **Leistung und Wartbarkeit – neues Array pro Bild, verstreute Zahlen (Z. 37–41, 47–54, 26, 28).** `pilze.filter` legt jedes Bild ein neues Array an (Arbeit für die Speicherbereinigung, auf alten iPhones spürbar). Die Zahlen 4, 8, 20, 34, 50, 70 stehen in der Logik; die 70 ist die halbe Joystick-Größe aus `stil.css` und stimmt nicht mehr, sobald jemand das CSS ändert. `rekord` ist eine Konstante, `window.spiel.rekord` bleibt beim Startwert.
   *Vorschlag:* Pilze an Ort und Stelle entfernen (rückwärts mit `splice`, nur wenn einer gesammelt wird), `Math.sqrt` statt `Math.hypot`, Zahlen nach `js/config/spiel.js`, Mitte aus `getBoundingClientRect`, `rekord` mitführen. Umgesetzt.
