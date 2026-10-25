# Spielgefühl: Damit es sich gut anfühlt

Wie stark ein Effekt wirkt, entscheidet Lukas. Horst baut alles abschaltbar und mit Werten in `config/`.

## Rückmeldung auf jede Handlung
| Ereignis | Rückmeldung (klein, aber sofort) |
|---|---|
| Treffer am Gegner | kurz weiß aufblitzen (0,08 s), kleiner Rückstoß, Schadenszahl steigt auf und verblasst |
| Spieler getroffen | rot aufblitzen, Bildschirm wackelt kurz, 0,5–1 s unverwundbar mit Blinken |
| Gegner besiegt | Partikel in Gegnerfarbe, kurzer Ton, Beute fliegt heraus |
| Einsammeln | Gegenstand fliegt zur Anzeige, Zahl hüpft kurz größer |
| Knopf gedrückt | Knopf wird kleiner (Skalierung 0,92), Ton |

## Werkzeuge
- **Wackeln (Screen Shake):** `wackeln = Math.min(1, wackeln + staerke)`, abklingen mit `wackeln -= dt * 3`. Versatz = `max * wackeln² * (zufall*2-1)`. Nie dauerhaft.
- **Treffer-Pause (Hit Stop):** bei großen Treffern 0,03–0,06 s die Spielzeit anhalten (`dt = 0`). Wirkt wuchtig.
- **Weiche Übergänge (Easing):** `ausEase = 1 - (1 - t) ** 3` für Aufpoppen, `federn = 1 + 2.7 * (t-1)**3 + 1.7 * (t-1)**2` für Überschwingen.
- **Partikel:** aus einem Pool, je 0,3–0,8 s Lebenszeit, Geschwindigkeit nimmt ab, Größe und Deckkraft gehen gegen 0. Höchstens etwa 200 gleichzeitig.
- **Quetschen und Dehnen:** Beim Landen kurz breit und flach (1,2 × 0,8), beim Springen schmal und hoch. Wirkt lebendig, braucht nur Bildskalierung.
- **Wackeln im Leerlauf:** Figuren atmen leicht (`1 + sin(zeit*3)*0.03`). Die Bilder sind Einzelbilder, Bewegung entsteht per Code.

## Schwierigkeit
- Langsam steigern: z. B. Gegner pro Minute `basis * (1 + minute * 0.15)`, mit Obergrenze.
- Die ersten 30 Sekunden sollen fast immer gelingen, dann wird es spannend.
- Wellen mit Pausen dazwischen statt gleichmäßigem Druck.
- Fairness: Gefahr ist vorher sichtbar (Warnung, Ausholen), Treffer-Kreise eher etwas kleiner als das Bild.
- Alle Werte in `config/` mit Kommentar, damit Lukas sie zum Testen ändern kann.

## Hinweise statt Tutorial
Kurzer Text, wenn etwas zum ersten Mal passiert („Ziehe links, um zu laufen.“). Er erscheint einmal und verschwindet nach 3 s oder bei der ersten Bewegung. Gemerkt wird er im Spielstand.
