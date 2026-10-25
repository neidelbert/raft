# Bericht Übung 5 – Fehlersuche im Pilzsammler

## Ergebnis
Alle vier gemeldeten Fehler sind an der Ursache behoben, und es gibt keine neuen Funktionen. Der Test prüft jeden Fehler einzeln: 22 Prüfungen, alle grün. Gegen die alte Fassung laufen 12 davon rot, so sieht man, dass sie die Fehler wirklich finden. Unterwegs habe ich noch Fehler gefunden, die niemand gemeldet hatte, die aber an denselben Stellen sitzen: neue Pilze direkt unter der Figur (Fehler 3) und ein Spiel, das im privaten Modus nach dem ersten Pilz stehen bleibt (Fehler 4).

## Die Fehler, einfach erklärt

### 1. „Auf meinem alten iPhone läuft die Figur langsamer“
**Ursache:** Die Figur lief bei jedem Bild 4 Punkte weiter. Ein neues iPhone zeichnet 60 Bilder pro Sekunde (also 240 Punkte pro Sekunde), ein altes, das nur 30 schafft, kommt auf die Hälfte. Ein iPhone mit 120-Hz-Bildschirm ist dagegen doppelt so schnell.
**Warum das passiert:** Der frühere Entwickler hat Bilder gezählt statt Zeit gemessen. Auf seinem Gerät fiel das nicht auf.
**Behoben:** Jetzt rechnet das Spiel mit der Zeit seit dem letzten Bild. Die Figur läuft auf jedem Gerät 240 Punkte pro Sekunde, also genauso schnell wie bisher auf einem normalen iPhone. Ein einzelnes Bild zählt höchstens 0,1 Sekunden, so springt die Figur nach einem Ruckler nicht.
**Test:** Er misst das Tempo einmal normal und einmal mit absichtlich gebremstem Browser (etwa 24 statt 54 Bilder pro Sekunde). Vorher waren es 215 und 98 Punkte pro Sekunde, jetzt beide Male 240.

### 2. „Manchmal läuft sie nach dem Loslassen weiter“
**Ursache:** Der Joystick hielt nur an, wenn das Signal „Finger hoch“ ankam. Das iPhone schickt aber manchmal stattdessen „Berührung abgebrochen“, zum Beispiel wenn man vom Bildschirmrand wischt, das Kontrollzentrum aufgeht oder ein Anruf kommt. Dieses Signal hat das Spiel nicht beachtet. Die Figur lief weiter, bis man den Joystick noch einmal berührte. Am PC passierte dasselbe, wenn man die Maus außerhalb des Kreises losließ.
**Warum das passiert:** Der Normalfall wurde bedacht, der Abbruch nicht.
**Behoben:** Der Joystick hält den Finger jetzt fest und bleibt bei ihm, auch wenn er den Kreis verlässt. Er hört auf „hoch“, „abgebrochen“ und „verloren“ und achtet nur auf den ersten Finger: Ein zweiter Finger übernimmt den Joystick nicht mehr.
**Test:** Er prüft, dass die Figur stillsteht, nach normalem Loslassen, nach einem Abbruch durch das System und nach Loslassen der Maus außerhalb des Kreises.

### 3. „Manchmal verschwinden zwei Pilze, obwohl ich nur einen eingesammelt habe“
Dafür gab es zwei Ursachen:
- **Zwei Pilze dicht beieinander:** Das Spiel hat alle Pilze in Reichweite weggenommen, aber immer nur 1 Punkt gegeben. Neue Pilze entstehen zufällig und können übereinander liegen. Dann sieht man einen, verliert aber zwei.
- **Neuer Pilz unter der Figur:** Für jeden gesammelten Pilz kommt ein neuer an eine zufällige Stelle, manchmal genau unter die Figur. Im nächsten Bild war er schon eingesammelt, bevor man ihn sehen konnte. In etwa jedem 25. Fall war das so (Test: 63 von 300).

**Warum das passiert:** Zählen und Neu-Verteilen wurden nur für den Normalfall „ein Pilz, weit weg“ gebaut.
**Behoben:** Jeder eingesammelte Pilz gibt einen Punkt. Neue Pilze entstehen mindestens 80 Punkte von der Figur entfernt.
**Test:** Zwei Pilze direkt an der Figur ergeben 2 Punkte. Danach wird 300-mal ein Pilz gesammelt: Jedes Mal gibt es genau 1 Punkt, und kein neuer Pilz entsteht unter der Figur.

### 4. „Im privaten Modus startet das Spiel gar nicht“
**Ursache:** Gleich beim Start liest das Spiel den Rekord aus dem Gerätespeicher. Im privaten Modus (je nach iPhone-Version oder wenn Website-Daten blockiert sind) verweigert Safari den Zugriff mit einer Fehlermeldung. Diese Meldung hat niemand abgefangen, also hat der Browser das ganze Spiel abgebrochen, bevor es überhaupt anfing.
Dazu kamen zwei verwandte Fehler an derselben Stelle:
- Bei älteren Safari-Versionen ist im privaten Modus nur das Schreiben verboten. Dann startete das Spiel, blieb aber beim ersten Pilz stehen, weil es dort den Rekord speichern wollte.
- Ein kaputter Eintrag im Speicher (z. B. nach einem Absturz) verhinderte den Start ebenfalls.

**Warum das passiert:** Der Speicher wurde behandelt, als würde er immer funktionieren.
**Behoben:** Lesen und Schreiben sind jetzt abgesichert (neue Datei `js/speicher.js`). Geht der Speicher nicht, startet das Spiel mit Rekord 0 und läuft normal weiter. Der Rekord wird dann nur nicht dauerhaft gespeichert. Alte Rekorde bleiben erhalten, weil der Name im Speicher derselbe ist.
**Test:** Drei Fälle: Speicher gesperrt, Schreiben verboten, kaputter Eintrag. Jedes Mal startet das Spiel, zwei Pilze ergeben „Pilze: 2 · Rekord: 2“, und es gibt keine Fehlermeldung.

## Was ich dabei noch geändert habe (ohne neue Funktion)
- Alle Zahlen stehen jetzt in `js/config/spiel.js`, mit Erklärung. Die Werte sind die alten, das Spiel fühlt sich gleich an.
- Die Pilzliste wird nicht mehr bei jedem Bild neu angelegt. Das schont alte iPhones.
- Die Anzeige `window.spiel.rekord` folgt jetzt dem Rekord (vorher blieb sie beim Startwert). Die Test-Schnittstelle sieht sonst genauso aus wie vorher.

## Arbeitsschritte
1. Code lesen, Verdächtiges notieren (siehe `REVIEW.md`).
2. Für jeden gemeldeten Fehler eine Prüfung schreiben und gegen die alte Fassung laufen lassen: rot.
3. Ursache beheben, Prüfung grün. Danach der nächste Fehler.
4. Den eigenen Test prüfen: Eine Tempo-Messung war ungenau, weil der Test-Browser manchmal kurz hängt (bis 170 ms). Der Test zählt jetzt wie das Spiel höchstens 0,1 s pro Bild.
5. Bildschirmfoto angesehen, `bash tests/alle-tests.sh` grün.

## Dateien (alle in `ausbildung/uebungen/stufe-5/`)
- `js/main.js` geändert, `js/config/spiel.js` und `js/speicher.js` neu. `index.html` und `stil.css` sind unverändert, die Vorlage auch.
- `test.js` (Port 8850–8853), `REVIEW.md`, `SCHULDEN.md`, dieser Bericht.

## Bitte am echten iPhone prüfen
- Joystick halten und vom unteren Rand wischen (App-Wechsel) oder das Kontrollzentrum öffnen: Die Figur muss danach stehen.
- Auf einem alten und einem neuen iPhone (120 Hz) gleich lange ziehen: Die Figur soll gleich weit kommen.
- Im privaten Safari-Fenster öffnen: Das Spiel startet, Pilze zählen. Nach dem Neuladen ist der Rekord dort wieder 0, das ist richtig so.
